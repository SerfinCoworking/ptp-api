import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Period from '../models/period.model';
import IEmployee from '../interfaces/employee.interface';
import { IPeriod, IShift, IEvent, ISigned } from '../interfaces/schedule.interface';
import moment from 'moment';
import * as _ from 'lodash';
import Employee from '../models/employee.model';

class SignedController extends BaseController{ 

  employeeSign = async (req: Request, res: Response) => {
    const { objectiveId, rfid } = req.body;
    try{
      const signed = moment(); // fecha hora fichado
      let period: IPeriod | null;
      let end = moment().set('date', 26);
      let searchLastPeriod: any;
      let currentPeriod: any;

      const isStartPeriod: boolean = signed.isSameOrAfter(end, 'date');

      const employee: IEmployee | null = await Employee.findOne({ rfid: rfid}).select('_id');
      if(!employee) throw new GenericError({property:"Empleado", message: 'No se ha encontrado un empleado válido para esta tarjeta.', type: "RESOURCE_NOT_FOUND"});
      // Si el dia del fichado es el comienzo de un nuevo periodo
      // debemos buscar el ultimo dia del periodo anterior
      // si no tiene egreso y es igual al mismo dia
      // entonces marcamos su fichado de egreso
      if( isStartPeriod ){
        
        let shift: IShift | undefined;
        let event: IEvent | undefined;
        searchLastPeriod = {
          start: moment(end).subtract(1, 'month').startOf('day'),
          end: moment(end).subtract(1, 'day').endOf('day'),
        }

        currentPeriod = {
          start: moment(end).startOf('day'),
          end: moment(end).add(1, 'month').subtract(1, 'day').endOf('day'),
        }
        
        period = await Period.findOne({ 
          "objective._id": objectiveId,
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
        if(period){
          let sIndex: number = 0;
          let eIndex: number = 0;
          shift = period.shifts.find((shift: IShift, index: number) => {
            sIndex = index;
            return shift.employee._id.equals(employee._id)
          });
          
          if(shift){
            event = shift.events.find((event: IEvent, index: number) => {
              const schTo = moment(event.toDatetime, "YYYY-MM-DD");
              eIndex = index;
              return schTo.isSame(signed, 'date') && typeof event.checkout === 'undefined';
            });
            if(event){
              // Si el ultimo dia del periodo anterior no fichó la salida
              period.shifts[sIndex].events[eIndex].checkout = signed.toDate();
              period.shifts[sIndex].signed?.push(signed.toDate());
              await period.save();
              return res.status(200).json({msg: "period found successfully", period});
            }
          }
        }
        
        
      }else{
        currentPeriod = {
          start: moment(end).subtract(1, 'month').startOf('day'),
          end: moment(end).subtract(1, 'day').endOf('day'),
        }
      }
      
      const periodCurrent: IPeriod | null = await Period.findOne({ 
        "objective._id": objectiveId,
        $and: [
          {fromDate: {$eq: currentPeriod.start.format("YYYY-MM-DD") }},
          {toDate: {$eq: currentPeriod.end.format("YYYY-MM-DD") }},
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


      if(!periodCurrent) throw new GenericError({property:"Periodo", message: 'No se ha encontrado una agenda válida para este objetivo.', type: "RESOURCE_NOT_FOUND"});

      await Promise.all( periodCurrent.shifts.map( async (shift: IShift, index: number) => {
        if (shift.employee._id.equals(employee._id)){
          const content: ISigned[] = await this.getAllEventsByDate(signed, shift);    

          if(content.length){
            let firstContent:  ISigned = await this.getClosestEvent(signed, content);
            firstContent = await this.setSigned(signed, firstContent);
            
            periodCurrent.shifts[index].events[firstContent.eventIndex] = firstContent.event;
            periodCurrent.shifts[index].signed?.push(signed.toDate());
            await periodCurrent.save();
          }else{
            throw new GenericError({property:"Employee", message: 'No se ha encontrado un horario asignado en este objetivo.', type: "RESOURCE_NOT_FOUND"});
          }
        }
      }));
      return res.status(200).json({msg: "period found successfully", periodCurrent});
   
    }catch(err){
      console.log(err);
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  manualSign = async (req: Request, res: Response): Promise<Response<any>> => {
    const {id, employee_id} = req.params;
    const { event } = await this.filterNullValues(req.body, ['event']);
    try{

      const period: IPeriod | null = await Period.findOneAndUpdate({_id: id},
        { $set: { "shifts.$[outer].events.$[event]": { ...event } }},
        { 
          arrayFilters: [
            {"outer.employee._id": employee_id},
            {"event._id": event._id }
          ]
        });

      if(!period) throw new GenericError({property:"Periodo", message: 'Periodo no encontrado', type: "RESOURCE_NOT_FOUND"});

      return res.status(200).json({msg: 'Fichaje guardado correctamente'});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }



  // obtencion de todos los evnetos de un empleado en un día
  private getAllEventsByDate = async (target: moment.Moment, shift: IShift): Promise<ISigned[]> => {
    const content: ISigned[] = [];
    Promise.all(shift.events.map((event: IEvent, index: number) => {

      // debemos tener en cuenta quitar un día, y agregar un día
      // Este caso se da cuando tengo un evento a las 23:30hs por ejemplo, y llego tarde a las 00:05hs
      // o bicevesa, tengo guardia a las 00:15hs y llego temprano a las 23:50hs
      const beforeToday = moment(target).subtract(1, 'day');
      const afterToday = moment(target).add(1, 'day');
      if ( (target.isSame(event.fromDatetime, 'day') || target.isSame(event.toDatetime, 'day')) || 
      ( beforeToday.isSame(event.fromDatetime, 'day') || beforeToday.isSame(event.toDatetime, 'day')) ||
       ( afterToday.isSame(event.fromDatetime, 'day') || afterToday.isSame(event.toDatetime, 'day')))
        content.push({event, eventIndex: index})
    }));
    return content;
  }

  private getClosestEvent = async (target: moment.Moment, content: ISigned[], range: number = 30): Promise<ISigned> => {
    
    let signed: ISigned;
    
    return new Promise((resolve, reject) => {
      let currentDiffTo: number = 0;
      content.map( async ( cont: ISigned, index: number) => {
        const diffFrom: number = Math.abs(target.diff(cont.event.fromDatetime, 'minutes'));
        const diffTo: number = Math.abs(target.diff(cont.event.toDatetime, 'minutes'));

        // solo tenemos encuenta dos cosas:
        // 1: si no hay un evento asignado, entonces definimos el primero por defecto
        // 2: si la diferencia entre la hora de "SALIDA" y la hora actual, es mayor a la diferencia entre la hora de "ENTRADA" y la hora actual.
        //      esto quiere decir que estaba más proximo a marcar el ingreso a la siguiente guardia que marcar el egreso de la guardia anterior
        if((currentDiffTo >= diffFrom) || typeof(signed) === 'undefined'){
          currentDiffTo = diffTo;
          signed = cont;
        }
      });
      resolve(signed);
    });
      
  }
  
  
  private setSigned = async (target: moment.Moment, content: ISigned): Promise<ISigned> => {
    return new Promise((resolve, reject)  => {
      const diffWStart = Math.abs(target.diff(content.event.fromDatetime, 'minutes'));
      const diffWEnd = Math.abs(target.diff(content.event.toDatetime, 'minutes'));
      const isEnd: boolean = (target.isSame(content.event.toDatetime, 'date') && diffWEnd < diffWStart);
      const isCheckin: boolean = !content.event.checkin && target.isSame(content.event.fromDatetime, 'date') && !isEnd
      if(isCheckin){
        // no tiene checkin o la hora de fichado es menor a la hora Entrada
        content.event.checkin = target.toDate();
      // }else if(isEnd){
      }else if(!content.event.checkout || target.isSameOrAfter(content.event.checkout, 'minutes') && target.isSame(content.event.toDatetime, 'date')){
        // no tiene checkout o la hora fichado es mayor a la última hora fichada
        content.event.checkout = target.toDate();
      }
      resolve(content);
    });    
  }
}

export default new SignedController();
