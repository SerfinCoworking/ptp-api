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

  signedEmployee = async (req: Request, res: Response) => {
    const { objectiveId, rfid } = req.body;
    try{
      const today = moment();
      const todayFixEndOfPeriod = moment();
      // const today = moment("2021-06-20 20:58:00");
      // const today = moment("2020-09-27 20:59:00");
      // const today = moment("2020-09-27 21:59:00");
      // const today = moment("2020-09-27 22:10:00");
      // const today = moment("2020-09-27 22:30:00");
      // const today = moment("2020-09-27 22:35:00");
      // const today = moment("2020-09-27 22:55:00");
      // const today = moment("2020-09-27 23:55:00");
      const yesterday = moment().subtract(1, 'day');
      
      const employee: IEmployee | null = await Employee.findOne({ rfid: rfid}).select('_id');
      if(!employee) throw new GenericError({property:"Empleado", message: 'No se ha encontrado un empleado válido para esta tarjeta.', type: "RESOURCE_NOT_FOUND"});

      // Query, busca si el dia anterior tiene (como en el caso del día 26),
      // Si el empleado que ficha tiene un evento asignado sin cerrar
      // Es decir si debe hacer el checkout el día 26 de cada mes, 
      // De lo contrario solo busca que exista un periodo que comprenda 
      // la fecha actual.
      const period: IPeriod | null = await Period.findOne({ 
        "objective._id": objectiveId,
        $or: [
          {
            "fromDate": {
              $lte: yesterday.format('YYYY-MM-DD')
            },
            "toDate": {
              $gte: yesterday.format("YYYY-MM-DD")
            },
            "shifts.employee._id": employee._id,
            "shifts.events.toDatetime": {
              $gte:  todayFixEndOfPeriod.startOf('day').toDate(),
              $lt:  todayFixEndOfPeriod.endOf('day').toDate()
            },
            "shifts.events.checkout": {
              $exists: false
            }
          },
          {
            "fromDate": { 
              $lte: today.format("YYYY-MM-DD")
            }, 
            "toDate": {
              $gte: today.format("YYYY-MM-DD")
            }
          }
        ]
        
      });

      if(!period) throw new GenericError({property:"Periodo", message: 'No se ha encontrado una agenda válida para este objetivo.', type: "RESOURCE_NOT_FOUND"});

      await Promise.all( period.shifts.map( async (shift: IShift, index: number) => {
        if (shift.employee._id.equals(employee._id)){
          const content: ISigned[] = await this.getAllEventsByDate(today, shift);    

          if(content.length){
            let firstContent:  ISigned = await this.getClosestEvent(today, content);
            firstContent = await this.setSigend(today, firstContent);
            
            period.shifts[index].events[firstContent.eventIndex] = firstContent.event;
            period.shifts[index].signed?.push(today.toDate());
            await period.save();
          }else{
            throw new GenericError({property:"Employee", message: 'No se ha encontrado un horario asignado en este objetivo.', type: "RESOURCE_NOT_FOUND"});
          }
        }
      }));
      return res.status(200).json({msg: "period found successfully", period});
    }catch(err){
      console.log(err);
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private permitBody = (permit?: string[] | undefined): Array<string> => {
    return permit ? permit : [ 'objective', 'fromDate', 'toDate', 'shifts' ];
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
          console.log(diffFrom,  moment(cont.event.fromDatetime).format("YYYY-MM-DD HH:mm:ss"), target.format("YYYY-MM-DD HH:mm:ss"), target.isSameOrAfter(cont.event.fromDatetime));
          signed = cont;
        }
      });
      resolve(signed);
    });
      
  }
  private getFirstClosestEvent = async (target: moment.Moment, content: IEvent[]): Promise<IEvent> => {
    
    let event: IEvent;
    
    return new Promise((resolve, reject) => {
      let currentDiffTo: number = 0;
      content.map( async ( cont: IEvent, index: number) => {
        const diffFrom: number = Math.abs(target.diff(cont.fromDatetime, 'minutes'));
        const diffTo: number = Math.abs(target.diff(cont.toDatetime, 'minutes'));

        // solo tenemos encuenta dos cosas:
        // 1: si no hay un evento asignado, entonces definimos el primero por defecto
        // 2: si la diferencia entre la hora de "SALIDA" y la hora actual, es mayor a la diferencia entre la hora de "ENTRADA" y la hora actual.
        //      esto quiere decir que estaba más proximo a marcar el ingreso a la siguiente guardia que marcar el egreso de la guardia anterior
        if((currentDiffTo >= diffFrom) || typeof(event) === 'undefined'){
          currentDiffTo = diffTo;
          console.log(diffFrom,  moment(cont.fromDatetime).format("YYYY-MM-DD HH:mm:ss"), target.format("YYYY-MM-DD HH:mm:ss"), target.isSameOrAfter(cont.fromDatetime));
          event = cont;
        }
      });
      resolve(event);
    });
      
  }
  
  private setSigend = async (target: moment.Moment, content: ISigned): Promise<ISigned> => {
    return new Promise((resolve, reject)  => {
      if(!content.event.checkin){
        // no tiene checkin o la hora de fichado es menor a la hora Entrada
        content.event.checkin = target.toDate();
      }else if(!content.event.checkout || target.isSameOrAfter(content.event.checkout, 'minutes')){
        // no tiene checkout o la hora fichado es mayor a la última hora fichada
        content.event.checkout = target.toDate();
      }
      resolve(content);
    });    
  }
}

export default new SignedController();
