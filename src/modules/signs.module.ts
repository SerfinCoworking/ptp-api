import { ObjectId } from "bson";
import moment from "moment";
import IEmployee from "../interfaces/employee.interface";
import { IEvent } from "../interfaces/schedule.interface";
import Employee from "../models/employee.model";
import { closestEventByEmployeeAndDatetime } from "../utils/helpers";

module.exports.getUserSignedEvent = async function(data: {objectiveId: string, rfid: number}): Promise<{event: IEvent, periodId: ObjectId, employeeId: ObjectId} | null | void> {
  
  const signed = moment("2021-11-27 16:01", "YYYY-MM-DD HH:mm"); // fecha hora fichado
  const end = moment("2021-11-27 16:01", "YYYY-MM-DD HH:mm").set('date', 26);
  // const signed = moment("2021-11-26 12:51", "YYYY-MM-DD HH::mm"); // fecha hora fichado
  // let end = moment("2021-11-26 12:51", "YYYY-MM-DD HH::mm").set('date', 26);
  let currPeriodRange: any;

  const isStartPeriod: boolean = signed.isSameOrAfter(end, 'date');

  const employee: IEmployee | null = await Employee.findOne({ rfid: data.rfid}).select('_id');
  
  if(!employee) return;
  // Si el dia del fichado es el comienzo de un nuevo periodo
  // debemos buscar el ultimo dia del periodo anterior
  // si no tiene egreso y es igual al mismo dia
  // entonces marcamos su fichado de egreso
  if(isStartPeriod){
    
    const prevPeriodRange = {
      start: moment(end).subtract(1, 'month').startOf('day'),
      end: moment(end).subtract(1, 'day').endOf('day'),
    }

    currPeriodRange = {
      start: moment(end).startOf('day'),
      end: moment(end).add(1, 'month').subtract(1, 'day').endOf('day'),
    }
    
    const result = await closestEventByEmployeeAndDatetime(signed, data.objectiveId, prevPeriodRange, employee._id.toString());
    if(result && result.event && result.period){
      console.log("entro en el return")
      return {event: result.event, periodId: result.period._id, employeeId: employee._id}
    }
      
  }else{
    currPeriodRange = {
      start: moment(end).subtract(1, 'month').startOf('day'),
      end: moment(end).subtract(1, 'day').endOf('day'),
    }
  }
    
  const result = await closestEventByEmployeeAndDatetime(signed, data.objectiveId, currPeriodRange, employee._id.toString());
  if(result && result.event && result.period)
    return {event: result.event, periodId: result.period._id, employeeId: employee._id}
    
};