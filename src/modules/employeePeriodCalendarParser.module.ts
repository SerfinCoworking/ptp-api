import moment from "moment";
import { IEvent, IPeriod, IShift } from "../interfaces/schedule.interface";
import INews from "../interfaces/news.interface";
import Employee from "../models/employee.model";
import IEmployee from "../interfaces/employee.interface";
import { getNews, otherEvents } from "../utils/periodParser.helpers";
import Period from "../models/period.model";
import { ObjectId } from "bson";

export default class EmployeePeriodCalendarParserModule {
  
  weeks: any = [];
  shifts: any = [];

  constructor(private periodId: string, private range: {fromDate: string, toDate: string}){}

  // Get employees only with other events and news, as weeks
  async employeesByWeeks(target: string){
    await this.buildWeeks();
    const period: IPeriod | null = await Period.findOne({_id: this.periodId});
    const employeesId: Array<ObjectId> = period?.shifts.map((shift: IShift) => shift.employee._id) || [];
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
  
  // Separar por semana [7 dias]
  private async buildWeeks(){
    const fromDate = moment(this.range.fromDate, "YYYY-MM-DD");
    const toDate = moment(this.range.toDate, "YYYY-MM-DD");
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
      const allEventsByEmployee: Array<IEvent> = await otherEvents(undefined, this.range.fromDate, this.range.toDate, employee);
      const newsByEmployee: Array<INews> = await getNews(employee._id, this.range.fromDate, this.range.toDate);
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
}
