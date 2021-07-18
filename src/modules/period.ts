import { ObjectID } from 'bson';
import moment from 'moment';
import IEmployee from '../interfaces/employee.interface';
import { IEvent, IPeriod, IShift } from '../interfaces/schedule.interface';
import Employee from '../models/employee.model';
import Period from '../models/period.model';

interface PeriodRangeDate {
  dateFrom: moment.Moment;
  dateTo: moment.Moment;
}

interface CalcHours {
  scheduleHs: number;
  signedHs: number;
  signedDNHs: {dayHours: number; nightHours: number};
  scheduleDNHs: {dayHours: number; nightHours: number};
}

export default class PeriodLiquidation {

  private periods: IPeriod[]
  private employees: IEmployee[]

  constructor(){
    this.periods = [];
    this.employees = [];
  }

  async scopePeriod(range: PeriodRangeDate, employeeId: string): Promise<void>{
    // buscamos el periodo por rango de fechas y filtramos por id de empleado
    this.periods = await Period.find(
      {
        $and: [{
          $or: [
          {
            $and: [
              { fromDate: { $lte: range.dateFrom.format("YYYY-MM-DD") } },
              { toDate: {$gte: range.dateFrom.format("YYYY-MM-DD") } }
            ]
          }, {
            $and: [
              { fromDate: { $lte: range.dateTo.format("YYYY-MM-DD") } },
              { toDate: {$gte: range.dateTo.format("YYYY-MM-DD") } }
            ]
          },{
            $and: [
              { fromDate: { $gte: range.dateFrom.format("YYYY-MM-DD") } },
              { toDate: {$lte: range.dateTo.format("YYYY-MM-DD") } }
            ]
          }]
        }]
      });

      this.employees = await Employee.find({
        _id: { $in : employeeId.split("_")}
      }).select("_id profile.firstName profile.lastName profile.avatar");
  }

  // Se obtienen las horas diurnas / nocturnas / totales / extras
  async buildEmployeeLiquidation(): Promise<any>{
    return await Promise.all(this.employees.map( async (employee: IEmployee) => {
      const hours: CalcHours = await this.buildFromPeriods(employee._id);
      return {
        employee,
        ...hours
      }
    }));
  }

  async buildFromPeriods(employeeId: ObjectID): Promise<CalcHours>{
    let real_total_hs: number = 0;
    let total_hs: number = 0;
    let total_scheduleDNHs: {dayHours: number; nightHours: number} = {dayHours: 0, nightHours: 0};
    let total_signedDNHs: {dayHours: number; nightHours: number} = {dayHours: 0, nightHours: 0};
    await Promise.all(this.periods.map( async (period: IPeriod) => {
      await Promise.all(period.shifts.map( async (shift: IShift) => {
        if(employeeId.equals(shift.employee._id)){
          const {signedHs, scheduleHs, scheduleDNHs, signedDNHs} = await this.calcTotalHours(shift);
          real_total_hs += signedHs;
          total_hs += scheduleHs;
          
          total_scheduleDNHs.dayHours += scheduleDNHs.dayHours;
          total_scheduleDNHs.nightHours += scheduleDNHs.nightHours;
          
          total_signedDNHs.dayHours += signedDNHs.dayHours;
          total_signedDNHs.nightHours += signedDNHs.nightHours;
        }
      }));
    }));
    return {signedHs: real_total_hs, scheduleHs: total_hs, scheduleDNHs: total_scheduleDNHs, signedDNHs: total_signedDNHs};
  }

  async calcTotalHours(shift: IShift): Promise<CalcHours>{
    let scheduleHs: number = 0;
    let signedHs: number = 0;
    let signedDNHs: {dayHours: number; nightHours: number} = {dayHours: 0, nightHours: 0};
    let scheduleDNHs: {dayHours: number; nightHours: number} = {dayHours: 0, nightHours: 0};
    await Promise.all(shift.events.map(async(event: IEvent) => {

      const scheduleDateTimeFrom = moment(event.fromDatetime);
      const scheduleDateTimeTo = moment(event.toDatetime);
      const signedDateTimeFrom = moment(event.checkin);
      const signedDateTimeTo = moment(event.checkout);
      scheduleHs += scheduleDateTimeTo.diff(scheduleDateTimeFrom, "hours") || 0;
      signedHs += signedDateTimeTo.diff(signedDateTimeFrom, "hours") || 0;

      let { dayHours: scheduleDH, nightHours: scheduleNH }= await this.calcDayAndNightHours(scheduleDateTimeFrom, scheduleDateTimeTo);
      scheduleDNHs.dayHours += scheduleDH;
      scheduleDNHs.nightHours += scheduleNH;
      
      let { dayHours: signedDH, nightHours: signedNH} = await this.calcDayAndNightHours(signedDateTimeFrom, signedDateTimeTo);
      signedDNHs.dayHours += signedDH;
      signedDNHs.nightHours += signedNH;
    }));
    return {signedHs, scheduleHs, scheduleDNHs, signedDNHs};
  }

  async calcDayAndNightHours(datetimeFrom: moment.Moment, datetimeTo: moment.Moment): Promise<{dayHours:number; nightHours: number}> {
    const maxHsDiurnas = 15;
    const maxHsNocturnas = 9;
    
    // Calculo de total horas diurnas y nocturnas
    // Nocturno 21 - 6
    // Diurno 6 - 21
    const startFD_f = moment(datetimeFrom).set("hours", 6).set("minutes", 0);
    const endFD_f = moment(datetimeFrom).set("hours", 21).set("minutes", 0);
    const isSameDate = datetimeFrom.isSame(datetimeTo, 'day');
    const startFD_t = moment(datetimeTo).set("hours", 6).set("minutes", 0);
    const totalHs: number = datetimeTo.diff(datetimeFrom, 'hours');
    let  dayHours: number = 0;
    let  nightHours: number = 0;
    if(totalHs > 0){
      // mi fecha de inicio comienza  dentro de la franja diurna
      if (datetimeFrom.isBetween(startFD_f, endFD_f, undefined, '[)')){
        // si es el mismo dia
        if(isSameDate){
          dayHours = endFD_f.diff(datetimeFrom, 'hours');
          if(dayHours < totalHs){
            // CASO: franja diurna / frnaja nocturna
            nightHours = totalHs - dayHours;
          }else{
            // CASO: franja diurna / franja diurna
            dayHours = datetimeTo.diff(datetimeFrom, 'hours');
          }
        }else{
          // son diferentes dias
          dayHours = endFD_f.diff(datetimeFrom, 'hours');
          if((totalHs - dayHours) > maxHsNocturnas){
            // CASO: fraja diurna / franja nocturna / franja diurna
            nightHours =  maxHsNocturnas;
            dayHours +=  (totalHs - dayHours) - maxHsNocturnas;
          }else{
            // CASO: franja diurna / franja nocturna
            nightHours = totalHs - dayHours;
          }
          
        }
      }else{
        // mi fecha de inicio comienza dentro de la franja nocturna
        // mismo dia
        if(isSameDate){
          nightHours = startFD_f.diff(datetimeFrom, 'hours');
          if(nightHours < totalHs){
            if((totalHs - nightHours) > maxHsDiurnas){
              // CASO: franja nocturna / franja diurna / franja nocturna
              dayHours =  maxHsDiurnas;
              nightHours +=  (totalHs - nightHours) - maxHsDiurnas;
            }else{
              // CASO: franja nocturna / franja diurna
              dayHours =  totalHs - nightHours;
            }
          }else{
            // CASO: franja nocturna / franja nocturna
            nightHours = datetimeTo.diff(datetimeFrom, 'hours');
          }
        }else{

          nightHours = startFD_t.diff(datetimeFrom, 'hours');

          if((totalHs - nightHours) > maxHsDiurnas){
            // CASO: franja nocturna / franja diurna / franja nocturna
            dayHours =  maxHsDiurnas;
            nightHours +=  (totalHs - nightHours) - maxHsDiurnas;
          }else{
            // CASO: franja noctuna / franja diurna
            dayHours =  totalHs - nightHours;
          }
        }
      }
    }
    return {dayHours, nightHours};
  }
}



// if(employee._id.equals(shift.employee._id)){
//   const datetimeFrom = moment(event.fromDatetime);
//   const datetimeTo = moment(event.toDatetime);


//   let  dayHours: number = 0;
//   let  nightHours: number = 0;
//   // Obetencion de viatiacos:
//   // 1 por cada guardia registrada
//   total_viaticos++; 


 
  



//   // return res.status(200).json({
//   //   employee: `${employee.profile.firstName} ${employee.profile.lastName}`,
//   //   totalHs,
//   //   nightHours,
//   //   dayHours
//   // });




//   day_hours += dayHours;
//   night_hours += nightHours;
//   total_hours += (dayHours + nightHours);
//   total_extra += 0;       
//   // Fin calculo de total horas diurnas y nocturnas          
  
//   // calculo de horas feriados
//   let feriadoHours: number = 0;
//   await Promise.all(newsFeriados.map( async (feriado: INews, index: number) => {
//     const total: number = this.calculateHours(feriado, employee, datetimeFrom, datetimeTo);
//     feriadoHours += total;
//     Object.assign(newsFeriados[index],{ worked_hours: ((feriado.worked_hours || 0) + total) });
//     total_feriado += total;
//   }));

//   // [Cantidad de horas / horas extras / eventos: por objetivo / horas / horas diurnas / horas nocturnas] Por semana
//   const eventWithObjective: IEventWithObjective = {
//     event: event,
//     objectiveName: period.objective.name,
//     diffInHours: datetimeTo.diff(datetimeFrom, 'hours'),
//     dayHours,
//     nightHours,
//     feriadoHours: feriadoHours
//   };

//   await Promise.all(weeks.map( async (week: any) => {
//     let total: number = 0;

//     // el calculo se hace por la guardia completa, no corta entre semanas
//     // si la guardia comienza en el ultimo dia de la semana, y termina en el comienzo
//     // de la siguiente, se toma el total de horas de la guardia como parte de la semana
//     // en la que inicio su guardia
//     if(datetimeFrom.isBetween(week.from, week.to, "date", "[]")){
//       total += datetimeTo.diff(datetimeFrom, 'hours');
//       week.events.push(eventWithObjective);
//     }
//     week.totalHours += total;
//     if(week.totalHours > 48){
//       week.totalExtraHours = week.totalHours - 48;
//     }

//   }));
  
//   await Promise.all(newsSuspension.map( async (suspension: INews, index: number) => {
//     const total: number = this.calculateHours(suspension, employee, datetimeFrom, datetimeTo);
//     const isInDate: boolean = (
//       (datetimeFrom.isBetween(suspension.dateFrom, suspension.dateTo, "date", "[]") && datetimeTo.isBetween(suspension.dateFrom, suspension.dateTo, "date", "[]")) ||
//       (datetimeFrom.isBetween(suspension.dateFrom, suspension.dateTo, "date", "[]")) ||
//       (datetimeTo.isBetween(suspension.dateFrom, suspension.dateTo, "date", "[]"))
//     )
//     Object.assign(newsSuspension[index],{ worked_hours: ((suspension.worked_hours || 0) + total) });
//     total_suspension += total;

//     if(!total_suspension_by_working_day.includes(datetimeFrom.format("YYYY-MM-DD")) && isInDate){
//       total_suspension_by_working_day.push(datetimeFrom.format("YYYY-MM-DD"));
//     }                   
//   }));
    
//   // licencias justificadas
//   await Promise.all(newsLicJustificada.map( async (lic_justificada: INews, index: number) => {
    
//     const total: number = this.calculateHours(lic_justificada, employee, datetimeFrom, datetimeTo);
//     const isInDate: boolean = (
//       (datetimeFrom.isBetween(lic_justificada.dateFrom, lic_justificada.dateTo, "date", "[]") && datetimeTo.isBetween(lic_justificada.dateFrom, lic_justificada.dateTo, "date", "[]")) ||
//       (datetimeFrom.isBetween(lic_justificada.dateFrom, lic_justificada.dateTo, "date", "[]")) ||
//       (datetimeTo.isBetween(lic_justificada.dateFrom, lic_justificada.dateTo, "date", "[]"))
//     )

//     Object.assign(newsLicJustificada[index], { assigned_hours: ((lic_justificada.assigned_hours || 0) + total) });
//     // asignamos la cantidad de horaas segun agrupacion por "reason"
//     if(lic_justificada.reason?.key.toUpperCase() === 'EMFERMEDAD'){ 
//       // se cuentan la cantidad de eventos que poseen las licencias por emfermedad
//       // entre los dias de la novedad
//       if(datetimeFrom.isBetween(lic_justificada.dateFrom, lic_justificada.dateTo, 'date', '[]') || datetimeTo.isBetween(lic_justificada.dateFrom, lic_justificada.dateTo, 'date', '[]')){
//         quantity_of_events++;
//       }
//     }
//     await Promise.all(lic_justificada_group_by_reason.map(( reason: any) => {
//       if(lic_justificada.reason?.key.toUpperCase() === reason.key){ 
//         reason.assigned_hours += total;
//       }
//     }));

//     total_lic_justificada += total;

//     if(!total_lic_jus_by_working_day.includes(datetimeFrom.format("YYYY-MM-DD")) && isInDate){
//       total_lic_jus_by_working_day.push(datetimeFrom.format("YYYY-MM-DD"));
//     }
//   }));
  
//   // licencias no justificadas
//   await Promise.all(newsLicNoJustificada.map( async (lic_no_justificada: INews, index: number) => {
//     const total: number = this.calculateHours(lic_no_justificada, employee, datetimeFrom, datetimeTo);
//     const isInDate: boolean = (
//       (datetimeFrom.isBetween(lic_no_justificada.dateFrom, lic_no_justificada.dateTo, "date", "[]") && datetimeTo.isBetween(lic_no_justificada.dateFrom, lic_no_justificada.dateTo, "date", "[]")) ||
//       (datetimeFrom.isBetween(lic_no_justificada.dateFrom, lic_no_justificada.dateTo, "date", "[]")) ||
//       (datetimeTo.isBetween(lic_no_justificada.dateFrom, lic_no_justificada.dateTo, "date", "[]"))
//     )
//     Object.assign(newsLicNoJustificada[index],{ worked_hours: ((lic_no_justificada.worked_hours || 0) + total) });
//     total_lic_no_justificada += total;

//     if(!total_lic_no_jus_by_working_day.includes(datetimeFrom.format("YYYY-MM-DD")) && isInDate){
//       total_lic_no_jus_by_working_day.push(datetimeFrom.format("YYYY-MM-DD"));
//     }
//   }));
  
//   await Promise.all(newsArt.map( async (art: INews, index: number) => {
//     const total: number = this.calculateHours(art, employee, datetimeFrom, datetimeTo);
//     Object.assign(newsArt[index],{ worked_hours: ((art.worked_hours || 0) + total) });
//     total_art_in_hours += total;
//     const isInDate: boolean = (
//       (datetimeFrom.isBetween(art.dateFrom, art.dateTo, "date", "[]") && datetimeTo.isBetween(art.dateFrom, art.dateTo, "date", "[]")) ||
//       (datetimeFrom.isBetween(art.dateFrom, art.dateTo, "date", "[]")) ||
//       (datetimeTo.isBetween(art.dateFrom, art.dateTo, "date", "[]"))
//     )

//     if(!total_art_by_working_day.includes(datetimeFrom.format("YYYY-MM-DD")) && isInDate){
//       total_art_by_working_day.push(datetimeFrom.format("YYYY-MM-DD"));
//     }
//   }));    
// }