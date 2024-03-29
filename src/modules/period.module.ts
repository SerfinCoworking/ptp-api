import { ObjectId } from 'bson';
import moment from 'moment';
import IEmployee from '../interfaces/employee.interface';
import { ILiquidatedEmployee, CalculatedHours, IEventWithObjective, IHoursByWeek, PeriodRangeDate, IEmployeeLiq, ILiquidatedNews } from '../interfaces/liquidation.interface';
import { IEvent, IPeriod, IShift } from '../interfaces/schedule.interface';
import { calcDayAndNightHours, extractEvents, sum } from '../utils/helpers';
import NewsModule from './news.module';

export default class PeriodModule {

  private liquidate: ILiquidatedEmployee = {
    employee: {} as IEmployeeLiq,
    total_by_hours: {
      signed: {} as CalculatedHours,
      schedule: {} as CalculatedHours,
      news: {
        feriado: 0,
        suspension: 0,
        lic_justificada: 0,
        lic_no_justificada: 0,
        art: 0,
        capacitaciones: 0
      }
    },
    hours_by_working_day: {
      lic_justificadas: 0,
      lic_no_justificas: [],
      suspension: [],
      art: []
    },
    total_of_news: {
      vaciones_by_days: 0,
      adelanto_import: 0,
      plus_responsabilidad: 0,
      lic_sin_sueldo_by_days: 0,
      presentismo: 0,
      embargo: 0
    },
    total_viaticos: 0,
    lic_justificada_group_by_reason: [],
    liquidated_news_id: ''
  };

  constructor(private range: PeriodRangeDate, private periods: IPeriod[], private signedWeeks: IHoursByWeek[], private scheduleWeeks: IHoursByWeek[]){
  }

  async liquidateEmployee(employee: IEmployee): Promise<ILiquidatedEmployee> {
    this.liquidate.employee = this.mapToIEmployee(employee);
    const copyPeriods: IPeriod[] = JSON.parse(JSON.stringify(this.periods));
    const periods: IPeriod[] = copyPeriods.filter( per => {
      const shifts = per.shifts.filter( shift => employee._id.equals(shift.employee._id) && shift.events.length > 0 );
      per.shifts = shifts;
      return per.shifts.length > 0;
    });
    const events: IEvent[] = await extractEvents(periods);
    const news = new NewsModule(events, this.range);
    const newsBuilder = await news.buildNews(employee);

    const {signed, schedule} = await this.calcMainTotals(periods);
    this.liquidate.total_by_hours.signed = signed;
    this.liquidate.total_by_hours.schedule = schedule;
    this.liquidate.total_by_hours.signed.by_week = this.signedWeeks;
    this.liquidate.total_by_hours.signed.extras = await sum(this.signedWeeks, 'totalExtraHours');
    this.liquidate.total_by_hours.schedule.by_week = this.scheduleWeeks;
    this.liquidate.total_by_hours.schedule.extras = await sum(this.scheduleWeeks, 'totalExtraHours');
    this.liquidate.total_by_hours.news = newsBuilder.news;
    this.liquidate.hours_by_working_day = newsBuilder.hours_by_working_day;
    this.liquidate.total_of_news = newsBuilder.total_of_news;
    this.liquidate.total_viaticos = newsBuilder.total_viaticos;
    this.liquidate.lic_justificada_group_by_reason = newsBuilder.lic_justificada_group_by_reason;
    this.liquidate.liquidated_news_id = newsBuilder.liquidated_news;
    return this.liquidate; 
  }

  async calcMainTotals(periods: IPeriod[]): Promise<{ signed: CalculatedHours; schedule: CalculatedHours}>{
    let signed: CalculatedHours = {
      total: 0,
      by: {day: 0, night: 0},
      extras: 0,
      by_week: []
    };
    let schedule: CalculatedHours = {
      total: 0,
      by: {day: 0, night: 0},
      extras: 0,
      by_week: []
    };
    await Promise.all(periods.map( async (period: IPeriod) => {
      await Promise.all(period.shifts.map( async (shift: IShift) => {
        const {signed: sigByEvents, schedule: schByEvents} = await this.calcTotalHours(shift, period.objective.name);
        
        schedule.total += schByEvents.total;
        signed.total += sigByEvents.total;
        
        schedule.extras += schByEvents.extras;
        signed.extras += sigByEvents.extras;
        
        schedule.by.day += schByEvents.by.day;
        schedule.by.night += schByEvents.by.night;
        
        signed.by.day += sigByEvents.by.day;
        signed.by.night += sigByEvents.by.night;
      }));
    }));
    return { signed, schedule};
  }

  async calcTotalHours(shift: IShift, objectiveName: string): Promise<{signed: CalculatedHours, schedule: CalculatedHours}>{
    let signed: CalculatedHours = {
      total: 0,
      by: {day: 0, night: 0},
      extras: 0
    } as CalculatedHours;
    let schedule: CalculatedHours = {
      total: 0,
      by: {day: 0, night: 0},
      extras: 0
    } as CalculatedHours;
    
    await Promise.all(shift.events.map(async(event: IEvent) => {
      const scheduleDateTimeFrom: moment.Moment | null = event.fromDatetime ? moment(event.fromDatetime) : null;
      const scheduleDateTimeTo: moment.Moment | null = event.toDatetime ? moment(event.toDatetime) : null;
      let signedDateTimeFrom: moment.Moment | null = event.checkin ? moment(event.checkin) : null;
      let signedDateTimeTo: moment.Moment | null = event.checkout ? moment(event.checkout) : null;
      if(this.range.dateFrom.isSameOrBefore(event.fromDatetime, 'date') && this.range.dateTo.isSameOrAfter(event.fromDatetime, 'date')){
        // Calculo de horas agendadas
        if(scheduleDateTimeFrom && scheduleDateTimeTo){
          schedule.total += scheduleDateTimeTo.diff(scheduleDateTimeFrom, "hours");
          let { dayHours: scheduleDH, nightHours: scheduleNH }= await calcDayAndNightHours(scheduleDateTimeFrom, scheduleDateTimeTo);
          schedule.by.day += scheduleDH;
          schedule.by.night += scheduleNH;
          const eventWithObjectiveSchedule: IEventWithObjective = {
            event: event,
            objectiveName: objectiveName,
            diffInHours: scheduleDateTimeTo.diff(scheduleDateTimeFrom, 'hours') || 0,
            dayHours: scheduleDH,
            nightHours: scheduleNH,
            feriadoHours: 0
          };
          
          await this.calcByWeeks(this.scheduleWeeks, scheduleDateTimeFrom, scheduleDateTimeTo, eventWithObjectiveSchedule);
        }
        
        // Calculo de horas fichadas
        if(signedDateTimeFrom && signedDateTimeTo && scheduleDateTimeFrom && scheduleDateTimeTo){
          /**=========== Fichado: media hora antes / despues se toma horario de agenda =========== **/
          const diffSignedAndScheduleFrom: number = scheduleDateTimeFrom.diff(signedDateTimeFrom, 'minutes') || 0;
          const diffSignedAndScheduleTo: number = scheduleDateTimeTo.diff(signedDateTimeTo, 'minutes') || 0;
          
          signedDateTimeFrom = (Math.abs(diffSignedAndScheduleFrom) > 30 || event.checkin_corrected) ? signedDateTimeFrom : scheduleDateTimeFrom;
          signedDateTimeTo = (Math.abs(diffSignedAndScheduleTo) > 30 || event.checkout_corrected) ? signedDateTimeTo : scheduleDateTimeTo;
          /**=====================================================================================**/
          
          let { dayHours: signedDH, nightHours: signedNH} = await calcDayAndNightHours(signedDateTimeFrom, signedDateTimeTo, 'minutes');
          signed.by.day += signedDH;
          signed.by.night += signedNH;
          signed.total += (signedDH + signedNH) //Math.round(signedDateTimeTo.diff(signedDateTimeFrom, "minutes") / 60);
          const eventWithObjective: IEventWithObjective = {
            event: event,
            objectiveName: objectiveName,
            diffInHours: parseFloat((signedDateTimeTo.diff(signedDateTimeFrom, 'minutes') / 60).toFixed(2)) || 0,
            dayHours: signedDH,
            nightHours: signedNH,
            feriadoHours: 0
          };
          await this.calcByWeeks(this.signedWeeks, signedDateTimeFrom, signedDateTimeTo, eventWithObjective, 'minutes');
        }
      }

      
    }));
    return {signed, schedule};
  }

  async calcByWeeks(weeks: IHoursByWeek[], fromDate: moment.Moment, toDate: moment.Moment, eventWithObjective: IEventWithObjective, unit: string = 'hour'): Promise<void>{
    await Promise.all(weeks.map( (week) => {
      // el calculo se hace por la guardia completa, no corta entre semanas
      // si la guardia comienza en el ultimo dia de la semana, y termina en el comienzo
      // de la siguiente, se toma el total de horas de la guardia como parte de la semana
      // en la que inicio su guardia
      if(fromDate.isBetween(week.from, week.to, "date", "[]")){
        week.totalHours += (unit === 'minutes' ? parseFloat((toDate.diff(fromDate, 'minutes') / 60).toFixed(2)) : toDate.diff(fromDate, 'hour'));
        week.events?.push(eventWithObjective);
      }
      if(week.totalHours > 48){
        week.totalExtraHours = week.totalHours - 48;
      }
    }));
  }

  private mapToIEmployee(employee: IEmployee): IEmployeeLiq {
    return {
      _id: employee._id,
      enrollment: employee.enrollment,
      firstName: employee.profile.firstName,
      lastName: employee.profile.lastName,
      avatar: employee.profile.avatar,
      dni: employee.profile.dni,
      cuilPrefix: employee.profile.cuilPrefix,
      cuilDni: employee.profile.cuilDni,
      cuilSufix: employee.profile.cuilSufix,
      function: employee.profile.function,
      employer: employee.profile.employer,
      art: employee.profile.art,
      status: employee.status
    } as IEmployeeLiq;
  }
}
