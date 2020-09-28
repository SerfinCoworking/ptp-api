import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Schedule from '../models/schedule.model';
import Period from '../models/period.model';
import IEmployee from '../interfaces/employee.interface';
import { ISchedule, IPeriod,ICalendarList, IShift, IEvent, ISigned } from '../interfaces/schedule.interface';
import { PaginateResult, PaginateOptions } from 'mongoose';
import moment from 'moment';
import * as _ from 'lodash';
import Employee from '../models/employee.model';
import Objective from '../models/objective.model';
import IObjective from '../interfaces/objective.interface';
import { ObjectId } from 'mongodb';
import { range, reject } from 'lodash';

class ScheduleController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<ICalendarList>> => {
    const schedules: PaginateResult<ISchedule> = await Schedule.paginate({}, {page: 1, limit: 6, sort: {"objective.name": 1}});
    const calendarList: ICalendarList = {
      docs: [],
      total: schedules.total,
      limit: schedules.limit,
      page: schedules.page,
      pages: schedules.pages,
      offset: schedules.offset,
     };
    await Promise.all(schedules.docs.map(async (schedule: ISchedule) => {
      let period: PaginateResult<IPeriod> = await Period.paginate({"objective._id": schedule.objective._id}, { sort: { toDate: -1 }, page: 1, limit: 1 });
      let days: string[] = [];
      if(period.total > 0){
        days = this.getDaysObject(period.docs[0].fromDate, period.docs[0].toDate);
      }
      calendarList.docs.push({schedule, period, days});// set nested items
    }));

    return res.status(200).json(calendarList);
  }

  newRecord = async (req: Request, res :Response): Promise<Response<any>> => {
    try{
      // get objectives and employees
      const objectives: IObjective[] = await Objective.find().select('name');
      const employees: IEmployee[] = await Employee.find().select('profile.firstName profile.lastName');
      return res.status(200).json({objectives, employees});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }


  create = async (req: Request, res: Response): Promise<Response<any>> => {
    const body: any = await this.filterNullValues(req.body, this.permitBody(['objective']));
    try{
      let schedule: ISchedule | null = await Schedule.findOne({"objective._id": body.objective._id}).select('objective');
      let periods: IPeriod[];

      if(!schedule){
        schedule = await Schedule.create({"objective": body.objective});
        periods = [];
      }else{
        periods = await Period.find({"objective._id": schedule.objective._id}).select('objective fromDate toDate').sort({toDate: -1}).limit(3);
      }
      return res.status(200).json({schedule, periods});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  addPeriod = async (req: Request, res: Response): Promise<Response<any>> => {
    const body: any = await this.filterNullValues(req.body, this.permitBody(['fromDate', 'toDate', 'objective']));
    try{
      const period: IPeriod = await new Period({
         fromDate: body.fromDate,
         toDate: body.toDate,
         "objective._id": body.objective._id,
         "objective.name": body.objective.name
        });
        // validates date and objective period
        const isInvalid: boolean = await Period.schema.methods.validatePeriod(period);
      if(isInvalid){
        throw new GenericError({property:"Period", message: "No se pudo crear el Periodo debido a que una o ambas fechas ingresadas para este objectivo, ya se encuentran definidas.", type: "BAD_REQUEST"});
      }

      await period.save();
      return res.status(200).json({message: "Periodo creado correctamente", period: period});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  addShifts = async (req: Request, res: Response): Promise<Response<any>> => {
    const body: any = await this.filterNullValues(req.body, this.permitBody(['employees', 'periodId']));
    try{
      const period: IPeriod | null = await Period.findOne({ _id: body.periodId });
      if(!period) throw new GenericError({property:"Period", message: "No se encontro el periodo.", type: "BAD_REQUEST"});
      await Promise.all(body.employees.map(async( employee: IEmployee) => {
        const shift: IShift = {
          employee: {
            _id: new ObjectId(employee._id),
            firstName: employee.profile.firstName,
            lastName: employee.profile.lastName,
          },
          events: [] as IEvent[]
        };

        period.shifts.push(shift);
      }));

      period.save();

      return res.status(200).json({message: "Empleados agregados correctamente", period: period});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  getPeriod = async (req: Request, res: Response): Promise<Response<any>> => {
    const id: string = req.params.id;
    try{
      const period: IPeriod | null = await Period.findOne({_id: id});
      if(!period) throw new GenericError({property:"Periodo", message: 'Periodo no encontrado', type: "RESOURCE_NOT_FOUND"});

      const employees: IEmployee[] = await Employee.find().select('profile.firstName profile.lastName');

      return res.status(200).json({period, employees});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  savePeriod = async (req: Request, res: Response): Promise<Response<any>> => {
    const id: string = req.params.id;
    const body: any = await this.filterNullValues(req.body, this.permitBody());
    try{
      const opts: any = { runValidators: true };
      // update only shifts
      const period: IPeriod | null = await Period.findOneAndUpdate({_id: id}, {
        shifts: body.shifts
      }, opts);
      if(!period) throw new GenericError({property:"Periodo", message: 'Periodo no encontrado', type: "RESOURCE_NOT_FOUND"});

      return res.status(200).json(period);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  deletePeriod = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      await Period.findByIdAndDelete(id);
      return res.status(200).json("period deleted successfully");
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  signedEmployee = async (req: Request, res: Response) => {
    const { objectiveId, rfid } = req.body;
    try{
      const today = moment();
      // const today = moment("2020-09-27 20:50:00");
      // const today = moment("2020-09-27 20:59:00");
      // const today = moment("2020-09-27 21:59:00");
      // const today = moment("2020-09-27 22:10:00");
      // const today = moment("2020-09-27 22:30:00");
      // const today = moment("2020-09-27 22:35:00");
      // const today = moment("2020-09-27 22:55:00");
      // const today = moment("2020-09-27 23:55:00");
      console.log(today.format("YYYY-MM-DD HH:mm:ss"), "<===================== DEBUG");
      const employee: IEmployee | null = await Employee.findOne({ rfid: rfid}).select('_id');
      if(!employee) throw new GenericError({property:"Empleado", message: 'Empleado no encontrado', type: "RESOURCE_NOT_FOUND"});

      const period: IPeriod | null = await Period.findOne({"objective._id": objectiveId, 
        "fromDate": { 
          $lte: today.format("YYYY-MM-DD")
        }, 
        "toDate": {
          $gte: today.format("YYYY-MM-DD")
        }
      });

      if(!period) throw new GenericError({property:"Periodo", message: 'periodo no encontrado', type: "RESOURCE_NOT_FOUND"});
      
      await Promise.all( period.shifts.map( async (shift: IShift, index: number) => {
        if (shift.employee._id.equals(employee._id)){
          const content: ISigned[] = await this.getAllEventsByDate(today, shift);          
          if(content.length){
            let firstContent:  ISigned = await this.getClosestEvent(today, content);
            firstContent = await this.setSigend(today, firstContent);
            console.log(moment(firstContent.event.fromDatetime).format("YYYY-MM-DD HH:mm:ss"), moment(firstContent.event.toDatetime).format("YYYY-MM-DD HH:mm:ss"), "=================== FIST EVENT FOUND");
            console.log(moment(firstContent.event.checkin).format("YYYY-MM-DD HH:mm:ss"), moment(firstContent.event.checkout).format("YYYY-MM-DD HH:mm:ss"), "=================== FIST EVENT FOUND");

            period.shifts[index].events[firstContent.eventIndex] = firstContent.event;
            period.shifts[index].signed?.push(today.toDate());
            await period.save()    
          }
        }
      }));
      return res.status(200).json("period found successfully");
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  // ---------------

  private getDaysObject(from: string, to: string){
    // get closest sunday (before)
    const start = moment(from).subtract(1, "day").weekday((0));
    // get closest saturday (after)
    const end = moment(start).add(42, "day");
    const days = [];
    while(!(start.isSame(end, "day") && start.isSame(end, "month") && start.isSame(end, "year"))){
      days.push(start.format("YYYY-MM-DD"));
      start.add(1, "day");
    }
    return days;
  }

  private permitBody = (permit?: string[] | undefined): Array<string> => {
    return permit ? permit : [ 'objective', 'fromDate', 'toDate', 'shifts' ];
  }

  // obtencion de todos los evnetos de un empleado en un día
  private getAllEventsByDate = async (target: moment.Moment, shift: IShift): Promise<ISigned[]> => {
    const content: ISigned[] = [];
    Promise.all(shift.events.map((event: IEvent, index: number) => {
      if ( target.isSame(event.fromDatetime, 'day') || target.isSame(event.toDatetime, 'day'))
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
        // 2: si la diferencia entre la hora de "SALIDA" y la otra actual, es mayor a la diferencia entre la hora de "ENTRADA" y la hora actual.
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
  
  private setSigend = async (target: moment.Moment, content: ISigned): Promise<ISigned> => {
    return new Promise((resolve, reject)  => {
      
      if(!content.event.checkin && target.isSameOrBefore(content.event.fromDatetime, 'minutes')){
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

export default new ScheduleController();
