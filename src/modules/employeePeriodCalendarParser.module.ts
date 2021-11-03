import moment from "moment";
import { IEvent, IPeriod, IShift } from "../interfaces/schedule.interface";
import INews from "../interfaces/news.interface";
import Employee from "../models/employee.model";
import IEmployee from "../interfaces/employee.interface";
import { getNews, otherEvents } from "../utils/periodParser.helpers";
import Period from "../models/period.model";
import { ObjectId } from "bson";
import { IPeriodByEmployeeByWeek, IPeriodPrint, IPeriodWeekGroupByEmployee } from "../interfaces/period..print.interface.";
import IObjective from "../interfaces/objective.interface";
import Objective from "../models/objective.model";

export default class EmployeePeriodCalendarParserModule {
  
  weeks: any = [];
  period: IPeriod = {} as IPeriod;
  shifts: any = [];

  constructor(private periodId: string){}

  // Get employees only with other events and news, as weeks
  async employeesByWeeks(target: string){
    const period: IPeriod | null = await Period.findOne({_id: this.periodId});
    if (!this.period) return;
    
    this.period = period as IPeriod;
    await this.buildWeeks();

    const employeesId: Array<ObjectId> = this.period.shifts.map((shift: IShift) => shift.employee._id) || [];
    const employees: Array<IEmployee> = await Employee.find({ 
      $and: [
        { $or: [
          {"profile.firstName":  { $regex: new RegExp( target, "ig")}},
          {"profile.lastName":  { $regex: new RegExp( target, "ig")}},
        ]},
        { _id: { $nin: employeesId }}
      ]}
    ).select('_id profile.firstName profile.lastName profile.avatar');
    const weeksEvents = await this.fillWeeksWithShiftsByEmployee(employees);
    return weeksEvents;
  };
  
  // Get employees only with other events and news, as weeks
  async employeesGroupByWeeks(target?: string): Promise<IPeriodPrint | void>{
    const period: IPeriod | null = await Period.findOne({_id: this.periodId});
    if (!period) return;
    const objective: IObjective | null = await Objective.findOne({_id: period.objective._id});
    if (!objective) return;
    this.period = period;
    await this.buildWeeks();

    const weeksEvents: Array<IPeriodWeekGroupByEmployee> = await this.fillWeekByEmployee();
    return {period: {
      _id: this.period._id,
      fromDate: this.period.fromDate,
      toDate: this.period.toDate,
      objective: this.period.objective
    }, objective, weeksEvents};
  };
  
  // Separar por semana [7 dias]
  private async buildWeeks(): Promise<void>{
    const fromDate = moment(this.period.fromDate, "YYYY-MM-DD");
    const toDate = moment(this.period.toDate, "YYYY-MM-DD");
    const diffInDays = toDate.diff(fromDate, 'days');
    let counter: number = 0;
    let weeksDays: Array<any> = [];

    while(fromDate.isSameOrBefore(toDate)){
        
      counter++;
      
      weeksDays.push({day: fromDate.format('YYYY-MM-DD')});
      if(counter === 7){
        counter = 0;
        this.weeks.push(weeksDays);
        weeksDays = [];
      }else if((this.weeks.length * 7 + counter) === (diffInDays + 1)){
        this.weeks.push(weeksDays);
      }
      fromDate.add(1, 'day');
    }
  }

  private async fillWeeksWithShiftsByEmployee(employees: Array<IEmployee>){
    const filledWeek: Array<any> = [];
    await Promise.all(employees.map( async (employee: IEmployee) => {
      
      const weeksEvents: Array<any> = [];
      let totalHs: number = 0;

      // obtenemos todos los eventos que tenga el empleado en otros objetivos 
      // entre las mismas fechas del periodo
      const allEventsByEmployee: Array<IEvent> = await otherEvents(undefined, this.period.fromDate, this.period.toDate, employee);
      const newsByEmployee: Array<INews> = await getNews(employee._id, this.period.fromDate, this.period.toDate);
      await Promise.all(this.weeks.map( async (week: Array<any>) => {
        const dayEvents: Array<any> = [];
        let totalByWeekHs: number = 0;
        await Promise.all(week.map( async (date: any) => {
        
          const events: Array<IEvent> = [];
          const otherEvents: Array<IEvent> = [];
          const news: Array<INews> = [];
          
          await Promise.all(allEventsByEmployee.map((event: IEvent) => {
            const fromDate = moment(event.fromDatetime, "YYYY-MM-DD HH:mm");
            const toDate = moment(event.toDatetime, "YYYY-MM-DD HH:mm");
            if(fromDate.isSame(date.day, 'date')){
              otherEvents.push(event);
              totalByWeekHs += toDate.diff(fromDate, 'hours');
            }
          })); // fin other events
          
          await Promise.all(newsByEmployee.map((aNews: INews) => {
            const dayMoment = moment(date.day, 'YYYY-MM-DD');
            if(dayMoment.isBetween(aNews.dateFrom, aNews.dateTo, undefined, '[]')){
              news.push(aNews);
            }
          })); // fin other events

          dayEvents.push({
            date: date,
            events,
            otherEvents,
            news
          });

        })); //fin week
        totalHs += totalByWeekHs;
        weeksEvents.push({dayEvents, totalByWeekHs});
      })); //fin weeks

      filledWeek.push({
        employee: {
          _id: employee._id,
          firstName: employee.profile.firstName,
          lastName: employee.profile.lastName,
          avatar: employee.profile.avatar,
        },
        totalHs,
        weeks: weeksEvents
      })

    }));// fin shifts
    return filledWeek;
  }

  private async fillWeekByEmployee(): Promise<Array<IPeriodWeekGroupByEmployee>>{
    const result: Array<IPeriodWeekGroupByEmployee> = await Promise.all(this.weeks.map( async (week: Array<string>) => {
      const employeesGroupByWeek: Array<IPeriodByEmployeeByWeek> = [];
      await Promise.all(this.period.shifts.map( async (shift: IShift) => {
        const employeeGroupByWeek: IPeriodByEmployeeByWeek = {
          employee: shift.employee,
          week: []
        };
        await Promise.all(week.map( async (weekDay: any) => {
          const events: Array<IEvent> = [];

          const targetDate: moment.Moment = moment(weekDay.day, 'YYYY-MM-DD');
          await Promise.all(shift.events.map((event: IEvent) => {
            if(targetDate.isSame(event.fromDatetime, 'date')){
              events.push(event);
            }
          }));

          employeeGroupByWeek.week.push({
            date: weekDay.day,
            events
          });
        }));

        employeesGroupByWeek.push(employeeGroupByWeek);
      }));
      return {employeesWeek: employeesGroupByWeek};
    }));
    return result;
  }
}
