import { ObjectID } from 'bson';
import moment from 'moment';
import INews from '../interfaces/news.interface';
import { IEvent, IPeriod } from '../interfaces/schedule.interface';
import News from '../models/news.model';
import Period from '../models/period.model';

export default class EventModule {

  period: IPeriod | null = {} as IPeriod;
  news: INews[] = [];
  constructor(private periodId: string, private employeeId: string){}

  async replicateEventsToDays(days: string, targetEvents: IEvent[]): Promise<IPeriod | null> {

    this.period = await Period.findOne({_id: this.periodId});
    const currentEvents: IEvent[] = [];
    const otherEvents: IEvent[] = [];
    let periods: IPeriod[] = [];
    if(this.period){
      periods = await Period.find({
        $and: [
          {fromDate: {$eq: this.period.fromDate }},
          {toDate: {$eq: this.period.toDate }},
          {
            shifts: {
              $elemMatch: {
                "employee._id": {
                  $eq: this.employeeId
                }
              }
            }
          },
          {
            _id: { $ne: this.period._id }
          }
        ]
      });

      await Promise.all(this.period.shifts.map(({events, employee}) => {
        if(employee._id.equals(this.employeeId)){
          currentEvents.push(...events);
        }
      }));
      this.news = await this.hasNews(this.period.fromDate, this.period.toDate, this.employeeId);
    }

    if(periods.length){  
      await Promise.all(periods.map( async ({shifts}) => {
        await Promise.all(shifts.map(({events, employee}) => {
          if(employee._id.equals(this.employeeId)){
            otherEvents.push(...events);
          }
        }));
      }));
    }

    const {events, eventsToDelete} = await this.createOrUpdateEvents(days, targetEvents, currentEvents, otherEvents, false);
    
    if(eventsToDelete){
      await Period.findOneAndUpdate({_id: this.period?._id},
        { $pull: { "shifts.$[employee].events": { _id: { $in: eventsToDelete } } }},
        { 
          arrayFilters: [
            {"employee.employee._id": this.employeeId}
          ]
        });
    }
  const result: IPeriod | null = await Period.findOneAndUpdate({_id: this.period?._id},
    { $push: { "shifts.$[outer].events": events }},
    { 
      arrayFilters: [{"outer.employee._id": this.employeeId }]
    });
    return result;
  }

  async createOrUpdateEvents(days: string, targetEvents: IEvent[], currentEvents: IEvent[], otherEvents: IEvent[], keepCurrent: boolean = false): Promise<{events: IEvent[], eventsToDelete: ObjectID[]}>{
    const fromDate = moment(this.period?.fromDate, 'YYYY-MM-DD');
    const toDate = moment(this.period?.toDate, "YYYY-MM-DD");
    const weekDays = days.split('_');
    const events: IEvent[] = [];
    const currentEventsToDelete: ObjectID[] = [];
    const toDay = moment();
    while(fromDate.isSameOrBefore(toDate, 'date')){
      const weekDay = fromDate.weekday().toString();

      // this date it is include by selected days to replicate
      if(weekDays.includes(weekDay) && fromDate.isAfter(toDay)){

        const hasOtherEvent = otherEvents.find((event) => {
          return fromDate.isSame(event.fromDatetime, 'date') || fromDate.isSame(event.toDatetime, 'date')
        });
        
        const hasCurrentEvent = currentEvents.filter((event) => {
          return fromDate.isSame(event.fromDatetime, 'date') || fromDate.isSame(event.toDatetime, 'date')
        });
        // this date hasn t other events, push new events
        if(!hasOtherEvent){

          // this date has current event and should clean it or hasn t current events
          if(hasCurrentEvent.length && !keepCurrent){

            await Promise.all(hasCurrentEvent.map( async (event) => {
              await Promise.all(targetEvents.map( async (targetEvent) => {
                const targetFrom = moment(targetEvent.fromDatetime, "YYYY-MM-DD HH:mm");
                if(targetFrom.isAfter(event.toDatetime, 'date') || (targetFrom.isSame(event.toDatetime, 'date') && targetFrom.isAfter(event.toDatetime, 'hour'))){
                  if(event._id){
                    currentEventsToDelete.push(event._id);
                    const clonedEvents = await this.cloneEvents(targetEvents, fromDate);
                    events.push(...clonedEvents);
                  }
                }
              }));
            }));
          }else{
            const clonedEvents = await this.cloneEvents(targetEvents, fromDate);
            events.push(...clonedEvents);
          }          
        }
      }
      fromDate.add(1, 'day');
    }
    return {events, eventsToDelete: currentEventsToDelete};
  }

  async cloneEvents(targetEvents: IEvent[], fromDate: moment.Moment): Promise<IEvent[]>{
    const events: IEvent[] = [];
    let hasNews: INews | undefined = this.news.find((news) => fromDate.isBetween(news.dateFrom, news.dateTo, undefined, "[]"));

    await Promise.all(targetEvents.map( async (event) => {

      if(event.fromDatetime && event.toDatetime && !hasNews){
        const toCloneFrom = moment(event.fromDatetime, 'YYYY-MM-DD HH:mm');
        const toCloneTo = moment(event.toDatetime, 'YYYY-MM-DD HH:mm');
        const toCloneIsSameDate: boolean = toCloneFrom.isSame(toCloneTo, 'date');

        const startEvent = moment(fromDate).hour(toCloneFrom.hour()).minute(toCloneFrom.minute());
        const endEvent = moment(fromDate).hour(toCloneTo.hour()).minute(toCloneTo.minute());

        if(!toCloneIsSameDate){
          endEvent.add(1, 'day');
        }

        events.push({
          fromDatetime: new Date(startEvent.toDate()),
          toDatetime: new Date(endEvent.toDate()),
          color: event.color,
          name: event.name
        });
      }
    }));
    return events;
  }

  async hasNews(dateFrom: string , dateTo: string, employee_id: string): Promise<INews[]> {
    return await News.find({ 
      'concept.key': {$nin: [
        'ALTA',
        'ACTIVO',
        'BAJA',
        'FERIADO',
        'ADELANTO',
        'CAPACITACIONES',
        'EMBARGO',
        'PLUS_RESPONSABILIDAD'
      ]},
      $or: [
        {
          'dateFrom': { $lt: dateFrom},
          'dateTo': { $gt: dateTo }
        },
        { 
          'dateFrom': { $eq: dateFrom}
        },
        {
          'dateTo': { $eq: dateFrom }
        },
        { 
          'dateFrom': { $eq: dateTo}
        },
        {
          'dateTo': { $eq: dateTo }
        },
        {
          $and: [
            { 
              'dateFrom': { $gt: dateFrom},
            },{
              'dateFrom': { $lt: dateTo }
            },
          ]
        },
        { 
          $and: [
            { 
              'dateTo': { $gt: dateFrom},
            },{
              'dateTo': { $lt: dateTo }
            },
          ]
        }
      ],
      'employee._id': employee_id
    });
  }
}
