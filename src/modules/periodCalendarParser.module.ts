import moment from "moment";
import { IEvent, IPeriod, IShift } from "../interfaces/schedule.interface";
import Period from "../models/period.model";
import { ObjectId } from 'mongodb';
import INews from "../interfaces/news.interface";
import News from "../models/news.model";

export default class PeriodCalendarParserModule {
  
  weeks: any = [];
  shifts: any = [];

  constructor(private period: IPeriod){}

  async toWeeks(){
    await this.buildWeeks();
    const weeksEvents = await this.fillWeeksWithShifts();
    return {weeksEvents, weeks: this.weeks, period: {
      _id:  this.period._id,
      objective: this.period.objective,
      fromDate: this.period.fromDate,
      toDate: this.period.toDate
    }};
  };

  // Separar por semana [7 dias]
  private async buildWeeks(){
    const fromDate = moment(this.period.fromDate, "YYYY-MM-DD");
    const toDate = moment(this.period.toDate, "YYYY-MM-DD");
    const diffInDays = toDate.diff(fromDate, 'days');
    let counter: number = 0;
    let weeksDays: Array<any> = [];
    const feriados: Array<INews> = await this.getFeriados(this.period.fromDate, this.period.toDate);

    while(fromDate.isSameOrBefore(toDate)){
        
      counter++;
      
      let feriado: INews | undefined = feriados.find((aNews: INews) => fromDate.isBetween(aNews.dateFrom, aNews.dateTo, undefined, '[]'));
      weeksDays.push({day: fromDate.format('YYYY-MM-DD'), feriado});
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

  private async fillWeeksWithShifts(){
    const filledWeek: Array<any> = [];
    await Promise.all(this.period.shifts.map( async (shift: IShift) => {
      
      const weeksEvents: Array<any> = [];
      let totalHs: number = 0;

      // obtenemos todos los eventos que tenga el empleado en otros objetivos 
      // entre las mismas fechas del periodo
      const allEventsByEmployee: Array<IEvent> = await this.otherEvents(this.period._id, this.period.fromDate, this.period.toDate, shift.employee);
      const newsByEmployee: Array<INews> = await this.getNews(shift.employee._id, this.period.fromDate, this.period.toDate);

      await Promise.all(this.weeks.map( async (week: Array<any>) => {
        const dayEvents: Array<any> = [];
        let totalByWeekHs: number = 0;
        await Promise.all(week.map( async (date: any) => {
        
          const events: Array<IEvent> = [];
          const otherEvents: Array<IEvent> = [];
          const news: Array<INews> = [];

          await Promise.all(shift.events.map((event: IEvent) => {
            const fromDate = moment(event.fromDatetime, "YYYY-MM-DD HH:mm");
            const toDate = moment(event.toDatetime, "YYYY-MM-DD HH:mm");
            if(fromDate.isSame(date.day, 'date')){
              events.push(event);
              totalByWeekHs += toDate.diff(fromDate, 'hours');
            }
          })); // fin events
          
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
        employee: shift.employee,
        totalHs,
        weeks: weeksEvents
      })

    }));// fin shifts
    return filledWeek;
  }

  async otherEvents(periodId: ObjectId, dateFrom: string, dateTo: string, employee: any): Promise<Array<IEvent>>{
    const events: Array<IEvent> = [];
    const periods: Array<IPeriod> = await Period.find({
      $and: [{
        $or: [
        {
          $and: [
            { fromDate: { $lte: dateFrom } },
            { toDate: {$gte: dateFrom } }
          ]
        }, {
          $and: [
            { fromDate: { $lte: dateTo } },
            { toDate: {$gte: dateTo } }
          ]
        },{
          $and: [
            { fromDate: { $gte: dateFrom } },
            { toDate: {$lte: dateTo } }
          ]
        }],
        shifts: {
          $elemMatch: {
            $and: [
              { 'employee._id': { $eq: employee._id } },
              { 
                events: {
                  $elemMatch: {
                    $or: [
                      {
                        $and: [
                          { fromDatetime: { $lte: dateFrom } },
                          { toDatetime: {$gte: dateFrom } }
                        ]
                      }, {
                        $and: [
                          { fromDatetime: { $lte: dateTo } },
                          { toDatetime: {$gte: dateTo } }
                        ]
                      },{
                        $and: [
                          { fromDatetime: { $gte: dateFrom } },
                          { toDatetime: {$lte: dateTo } }
                        ]
                      }]
                  }
                }
              }
            ]              
          }
        },
        _id: { $ne: periodId }
      }]
    });

    await Promise.all(periods.map( async (period: IPeriod) => {
      await Promise.all(period.shifts.map( async (shift: IShift) => {
        if(shift.employee._id.equals(employee._id)){
          await Promise.all(shift.events.map((ev: IEvent) => {
            events.push(ev);
          }));
        }
      }));
    }));

    return events;
  }

  async getNews(employeeId: ObjectId, dateFrom: string, dateTo: string): Promise<Array<INews>>{
    return await News.find({
      $and: [
        {
          $or: [
            {
              $and: [
                { dateFrom: { $lte: dateFrom } },
                { dateTo: { $gte: dateFrom } }
              ]
            }, {
              $and: [
                { dateFrom: { $lte: dateTo } },
                { dateTo: { $gte: dateTo } }
              ]
            },{
              $and: [
                { dateFrom: { $gte: dateFrom } },
                { dateTo: { $lte: dateTo } }
              ]
            }
          ]
        },
        {
          $or: [
            {
              $and: [{
                'concept.key': { $in: [
                  'BAJA',
                  'LIC_JUSTIFICADA',
                  'VACACIONES',
                  'LIC_NO_JUSTIFICADA',
                  'ART',
                  'SUSPENSION',
                  'LIC_SIN_SUELDO'
                ]},
                'employee._id': { $eq: employeeId }
              }]
            }
          ]
        }
      ]      
    }).select('concept dateFrom dateTo employee._id');
  }
  
  async getFeriados(dateFrom: string, dateTo: string): Promise<Array<INews>>{
    return await News.find({
      $and: [
        {
          $or: [
            {
              $and: [
                { dateFrom: { $lte: dateFrom } },
                { dateTo: { $gte: dateFrom } }
              ]
            }, {
              $and: [
                { dateFrom: { $lte: dateTo } },
                { dateTo: { $gte: dateTo } }
              ]
            },{
              $and: [
                { dateFrom: { $gte: dateFrom } },
                { dateTo: { $lte: dateTo } }
              ]
            }
          ]
        },
        { 'concept.key': 'FERIADO' }
      ]      
    }).select('concept dateFrom dateTo');
  }
}
