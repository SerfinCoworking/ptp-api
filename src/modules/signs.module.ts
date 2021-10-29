import { ObjectId } from "bson";
import moment from "moment";
import IEmployee from "../interfaces/employee.interface";
import { IEvent, IPeriod, IShift } from "../interfaces/schedule.interface";
import Employee from "../models/employee.model";
import Period from "../models/period.model";

module.exports.getUserSignedEvent = async function(data: {objectiveId: string, rfid: number}): Promise<{event: IEvent, periodId: ObjectId, employeeId: ObjectId} | null | void> {
  
  const signed = moment(); // fecha hora fichado
  let period: IPeriod | null;
  let end = moment().set('date', 26);
  let searchLastPeriod: any;
  let currentPeriod: any;

  const isStartPeriod: boolean = signed.isSameOrAfter(end, 'date');

  const employee: IEmployee | null = await Employee.findOne({ rfid: data.rfid}).select('_id');
  
  if(!employee) return;
  // Si el dia del fichado es el comienzo de un nuevo periodo
  // debemos buscar el ultimo dia del periodo anterior
  // si no tiene egreso y es igual al mismo dia
  // entonces marcamos su fichado de egreso
  if( isStartPeriod){
    
    // let shift: IShift | undefined;
    // let event: IEvent | undefined;
    searchLastPeriod = {
      start: moment(end).subtract(1, 'month').startOf('day'),
      end: moment(end).subtract(1, 'day').endOf('day'),
    }

    currentPeriod = {
      start: moment(end).startOf('day'),
      end: moment(end).add(1, 'month').subtract(1, 'day').endOf('day'),
    }
    
    period = await Period.findOne({ 
      "objective._id": data.objectiveId,
      $and: [
        {fromDate: {$eq: searchLastPeriod.start.format("YYYY-MM-DD") }},
        {toDate: {$eq: searchLastPeriod.end.format("YYYY-MM-DD") }},
        {
          shifts: {
            $elemMatch: {
              "employee._id": {
                $eq: employee._id
              }
            }
          }
        }
      ]
    });

      const shiftIndex: number | undefined = period?.shifts.findIndex((shift: IShift): boolean => shift.employee._id.equals(employee._id));
      if(shiftIndex && shiftIndex >= 0){
        const event: IEvent | undefined = period?.shifts[shiftIndex].events.find((event: IEvent) => {
          const schTo = moment(event.toDatetime, "YYYY-MM-DD");
          return schTo.isSame(signed, 'date') && typeof event.checkout === 'undefined';
        });
        if(event && period)
          return {event, periodId: period._id, employeeId: employee._id}
      }
      
  }else{
    currentPeriod = {
      start: moment(end).subtract(1, 'month').startOf('day'),
      end: moment(end).subtract(1, 'day').endOf('day'),
    }
  }
    
  const periodCurrent: IPeriod | null = await Period.findOne({ 
    "objective._id": data.objectiveId,
    $and: [
      {fromDate: {$eq: currentPeriod.start.format("YYYY-MM-DD") }},
      {toDate: {$eq: currentPeriod.end.format("YYYY-MM-DD") }},
      {
        shifts: {
          $elemMatch: {
            "employee._id": {
              $eq: employee?._id
            }
          }
        }
      }
    ]
  });

  const shiftIndex: number | undefined = periodCurrent?.shifts.findIndex((shift: IShift): boolean => shift.employee._id.equals(employee._id));
  if(typeof(shiftIndex) !== 'undefined' && shiftIndex >= 0){
    const event: IEvent | undefined = periodCurrent?.shifts[shiftIndex].events.reduce((prev: IEvent, curr: IEvent) => {

      // const diffFromPrev: number = Math.abs(signed.diff(prev.fromDatetime, 'minutes'));
      const diffToPrev: number = Math.abs(signed.diff(prev.toDatetime, 'minutes'));
      
      const diffFromCurrent: number = Math.abs(signed.diff(curr.fromDatetime, 'minutes'));
      // const diffToCurrent: number = Math.abs(signed.diff(curr.toDatetime, 'minutes'));
      return diffFromCurrent >= diffToPrev ? prev : curr;
    });

    if(event && periodCurrent){
      typeof(event.checkin) !== 'undefined' ? (event.checkout = signed.toDate()) : (event.checkin = signed.toDate());
      return {event, periodId: periodCurrent._id, employeeId: employee._id};
    }
  }

};