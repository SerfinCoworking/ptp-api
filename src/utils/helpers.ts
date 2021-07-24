import moment from "moment";
import { ObjectId } from "mongodb";
import { GenericError } from "../common/errors.handler";
import { IEvent, IPeriod } from "../interfaces/schedule.interface";
import IUser from "../interfaces/user.interface";
import Movement from "../models/movement.model";
import User from "../models/user.model";

// Signature of the callback
type CallBackFindIndex<T> = (
  value: T,
  index?: number,
  collection?: T[]
) => Promise<boolean>;


export const aFindIndex = async <T>( elements: T[], cb: CallBackFindIndex<T> ): Promise<number> => {
  for (const [index, element] of elements.entries()) {
    if (await cb(element, index, elements)) {
      return index;
    }
  }

  return -1;
}

export const createMovement = async (userReq: any, action: string, resource: string, target: string): Promise<void> => {
  const user: IUser | null = await User.findOne({_id: userReq._id});
  if (!user) throw new GenericError({property:"User", message: 'Usuario no encontrado', type: "RESOURCE_NOT_FOUND"});
  await Movement.create({
    user:
    {
      _id: user._id,
      username: user.username,
      profile: {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          dni: user.profile.dni
      }
    },
    action,
    resource,
    target
  });   
}

export const calcDayAndNightHours = async (datetimeFrom: moment.Moment, datetimeTo: moment.Moment, dayStripeStartHs: number = 6, nightStripeStartHs: number = 21): Promise<{dayHours:number; nightHours: number}> => {
  const maxHsDiurnas = nightStripeStartHs - dayStripeStartHs;
  const maxHsNocturnas = (24 - nightStripeStartHs) + dayStripeStartHs;
  
  // Calculo de total horas diurnas y nocturnas
  // Nocturno 21 - 6
  // Diurno 6 - 21
  const startFD_f = moment(datetimeFrom).set("hours", dayStripeStartHs).set("minutes", 0);
  const endFD_f = moment(datetimeFrom).set("hours", nightStripeStartHs).set("minutes", 0);
  const isSameDate = datetimeFrom.isSame(datetimeTo, 'day');
  const startFD_t = moment(datetimeTo).set("hours", dayStripeStartHs).set("minutes", 0);
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


export const buildWeeks = (dateFrom: moment.Moment, dateTo: moment.Moment, template: any): any => {
  const weeks: any = [];
  const counterDay = moment(dateFrom);
  while(counterDay.isBefore(dateTo, 'date')){
    
    const fromDate: moment.Moment = moment(counterDay).startOf('day');
    const toDate: moment.Moment = moment(counterDay).add(6, 'days').endOf('day');
    if(toDate.isAfter(dateTo)){
      weeks.push({
        from: fromDate.format("YYYY-MM-DD"),
        to: dateTo.endOf('day').format("YYYY-MM-DD"),
        totalHours: 0,
        totalExtraHours: 0,
        events: []
      });
    }else{
      weeks.push({
        from: fromDate.format("YYYY-MM-DD"),
        to: toDate.format("YYYY-MM-DD"),
        totalHours: 0,
        totalExtraHours: 0,
        events: []
      });
    }

    counterDay.add(7, 'days');
  }
  return weeks;
}

export const extractEvents = async (periods: IPeriod[]): Promise<IEvent[]> => {
  const events: IEvent[] = [];
  await Promise.all(periods.map( async (period: IPeriod) => {
    await Promise.all(period.shifts.map( async (shift) => {
      events.push(...shift.events);
    }));
  }));
  return events;
}

export const sum = async (arr: any[], byField: string): Promise<number> => {
  let total: number = 0;
  await Promise.all(arr.map(( item: any) => {
    total += item[byField] || 0;
  }));
  return total;
}