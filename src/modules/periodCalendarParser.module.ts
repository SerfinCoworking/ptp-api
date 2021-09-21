import moment from "moment";
import { IEvent, IPeriod, IShift } from "../interfaces/schedule.interface";

export default class PeriodCalendarParserModule {
  
  weeks: any = [];
  shifts: any = [];

  constructor(private period: IPeriod){}

  async toWeeks(){
    this.buildWeeks();
    const result = await this.fillWeeksWithShifts();
    return result;
  };

  // Separar por semana [7 dias]
  private buildWeeks(){
    const fromDate = moment(this.period.fromDate, "YYYY-MM-DD");
    const toDate = moment(this.period.toDate, "YYYY-MM-DD");
    const diffInDays = toDate.diff(fromDate, 'days');
    let counter: number = 0;
    let weeksDays: Array<string> = [];

    while(fromDate.isSameOrBefore(toDate)){
        
      counter++;
      weeksDays.push(fromDate.format('YYYY-MM-DD'));
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

      await Promise.all(this.weeks.map( async (week: Array<string>) => {
        const dayEvents: Array<any> = [];
        await Promise.all(week.map( async (day: string) => {
        
          const events: Array<IEvent> = [];

          await Promise.all(shift.events.map((event: IEvent) => {
            const fromDate = moment(event.fromDatetime, "YYYY-MM-DD");
            if(fromDate.isSame(day, 'date')){
              events.push(event);
            }
          })); // fin events

          dayEvents.push({
            date: day,
            events
          });

        })); //fin week

        weeksEvents.push(dayEvents);
      })); //fin weeks

      filledWeek.push({
        employee: shift.employee,
        weeks: weeksEvents
      })

    }));// fin shifts
    return filledWeek;
  }

}
