import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Period from '../models/period.model';
import Schedule from '../models/schedule.model';
import IEmployee, { Status } from '../interfaces/employee.interface';
import { IPeriod, IShift, IEvent, ISchedule} from '../interfaces/schedule.interface';
import * as _ from 'lodash';
import Employee from '../models/employee.model';
import { ObjectId } from 'mongodb';
import moment from 'moment';
import IObjective from '../interfaces/objective.interface';
import Objective from '../models/objective.model';
import { createMovement } from '../utils/helpers';
import PeriodCalendarParserModule from '../modules/periodCalendarParser.module';
import EmployeePeriodCalendarParserModule from '../modules/employeePeriodCalendarParser.module';
import { PaginateOptions, PaginateResult } from 'mongoose';

class PeriodController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<IPeriod[]>> => {
    const { objectiveId } = req.params;
    const { search, concept, dateFrom, dateTo, page, limit, sort } = req.query;
    const target: string = await this.searchDigest(search);
    const sortDiggest: any = await this.sortDigest(sort, {"createdAt": -1});
    try{
      const queryBuilder = [];
      
      queryBuilder.push({ 
        "objective._id": objectiveId 
      });
      if(dateFrom && dateFrom.length > 0){
        queryBuilder.push({
          $or: [
            {"dateFrom": {$gte: dateFrom}},
            {"dateTo": {$gte: dateFrom}}
          ]
        });
      }
      
      if(dateTo && dateTo.length > 0){
        queryBuilder.push({
          $or:[
            {"dateFrom": {$lte: dateTo}},
            {"dateTo": {$lte: dateTo}}
          ]
        });
      }

      const query = queryBuilder.length ? { $and: queryBuilder } : {};
      const options: PaginateOptions = {
        sort: sortDiggest,
        page: (typeof(page) !== 'undefined' ? parseInt(page) : 1),
        limit: (typeof(limit) !== 'undefined' ? parseInt(limit) : 10)
      };

      const periods: PaginateResult<IPeriod> = await Period.paginate(query, options);
      return res.status(200).json(periods);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  create = async (req: Request, res: Response): Promise<Response<{period: IPeriod, shifts: IShift[]}>> => {
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
      
      await createMovement(req.user, 'creó', 'período', `Período del objetivo: ${period.objective.name} desde ${body.fromDate} hasta ${body.toDate}`);
      await period.save();
      const {periodDigest, shifts } = await this.getPeriodWithEmployees(period);
      return res.status(200).json({period: periodDigest, shifts});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  update = async (req: Request, res: Response): Promise<Response<{period: IPeriod, shifts: IShift[]}>> => {
    const body: any = await this.filterNullValues(req.body, this.permitBody(['fromDate', 'toDate']));
    const { id } = req.params;
    try{
      const period: IPeriod | null = await Period.findOne({_id: id});
      
      if(!period) throw new GenericError({property:"Period", message: "No se encontro el periodo.", type: "BAD_REQUEST"});
      
      period.fromDate = body.fromDate;
      period.toDate = body.toDate;
      
      // validates date and objective period
      const isInvalid: boolean = await Period.schema.methods.validatePeriod(period);
      
      if(isInvalid){
        throw new GenericError({property:"Period", message: "No se pudo actualizar el Periodo debido a que una o ambas fechas ingresadas para este objectivo, ya se encuentran definidas.", type: "BAD_REQUEST"});
      }

      await Promise.all(
        period.shifts.map(async (shift: IShift, sIndex: number) => {
          await Promise.all(shift.events.map((event: IEvent, eIndex: number) => {
            const fromDate = moment(event.fromDatetime);
            if(!fromDate.isBetween(period.fromDate, period.toDate)){
              period.shifts[sIndex].events.splice(eIndex, 1);
            }          
          }));
        })
      );
      await period.save();
      await createMovement(req.user, 'editó', 'período', `Período del objetivo: ${period.objective.name} desde ${body.fromDate} hasta ${body.toDate}`);
      const {periodDigest, shifts } = await this.getPeriodWithEmployees(period);
      return res.status(200).json({period: periodDigest, shifts});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  createShifts = async (req: Request, res: Response): Promise<Response<{period: IPeriod, shifts: IShift[]}>> => {
    const body: any = await this.filterNullValues(req.body, this.permitBody(['employees']));
    const { id } = req.params;
    try{
      const period: IPeriod | null = await Period.findOne({ _id: id });
      if(!period) throw new GenericError({property:"Period", message: "No se encontro el periodo.", type: "BAD_REQUEST"});
      await Promise.all(body.employees.map(async( employee: any) => {
        const shift: IShift = {
          employee: {
            _id: new ObjectId(employee._id),
            firstName: employee.firstName,
            lastName: employee.lastName,
            avatar: employee.avatar,
          },
          events: [] as IEvent[]
        };

        period.shifts.push(shift);
      }));
      await period.save();
      const {periodDigest, shifts } = await this.getPeriodWithEmployees(period);
      return res.status(200).json({period: periodDigest, shifts});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  show = async (req: Request, res: Response): Promise<Response<ISchedule>> => {
    const id: string = req.params.id;
    try{
      const period: IPeriod | null = await Period.findOne({_id: id});
      
      if(!period) throw new GenericError({property:"period", message: 'Periodo no encontrado', type: "RESOURCE_NOT_FOUND"});

      return res.status(200).json(period);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  monitor = async (req: Request, res: Response): Promise<Response<ISchedule>> => {
    const id: string = req.params.id;

    try{
      const period: IPeriod | null = await Period.findOne({_id: id});
      
      if(!period) throw new GenericError({property:"period", message: 'Periodo no encontrado', type: "RESOURCE_NOT_FOUND"});

      const periodParser = new PeriodCalendarParserModule(period);
      const result = await periodParser.toWeeks();
  
      return res.status(200).json(result);

    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }


  getPeriod = async (req: Request, res: Response): Promise<Response<{period: IPeriod, shifts: IShift[], schedule: ISchedule, objective: IObjective}>> => {
    try{
      const id: string = req.params.id;
      const period: IPeriod | null = await Period.findOne({_id: id});
      if(!period) throw new GenericError({property:"Periodo", message: 'Periodo no encontrado', type: "RESOURCE_NOT_FOUND"});
      
      const objective: IObjective | null = await Objective.findOne({"_id": period.objective._id}).select("name defaultSchedules");
      if(!objective) throw new GenericError({property:"Objective", message: 'Objectivo no encontrada', type: "RESOURCE_NOT_FOUND"});
      
      const schedule: ISchedule | null = await Schedule.findOne({"objective._id": period.objective._id});
      if(!schedule) throw new GenericError({property:"Schedule", message: 'Agenda no encontrada', type: "RESOURCE_NOT_FOUND"});
  
  
      const {periodDigest, shifts } = await this.getPeriodWithEmployees(period);
      return res.status(200).json({period: periodDigest, shifts, schedule, objective});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  //********* New implementation ***********//
  getPlannig = async (req: Request, res: Response):Promise<Response<any>> => {
    const id: string = req.params.id;
    const period: IPeriod | null = await Period.findOne({_id: id});
    if(!period) throw new GenericError({property:"Period", message: 'Periodo no encontrado', type: "RESOURCE_NOT_FOUND"});
    const objective: IObjective | null  =  await Objective.findOne({_id: period.objective._id}).select('defaultSchedules');
    if(!period) throw new GenericError({property:"Objective", message: 'Objetivo no encontrado', type: "RESOURCE_NOT_FOUND"});
    
    const periodParser = new PeriodCalendarParserModule(period);
    const result = await periodParser.toEmployees();

    return res.status(200).json({defaultSchedules: objective?.defaultSchedules, ...result});
  }
  
  getEmployeeForPlannig = async (req: Request, res: Response):Promise<Response<any>> => {
    const { periodId, fromDate, toDate, employee} = req.query;
    const periodParser = new EmployeePeriodCalendarParserModule(periodId, {fromDate, toDate});
    const result = await periodParser.employeesByWeeks(employee);

    return res.status(200).json(result);
  }

  addEmployeeInPlannig = async (req: Request, res: Response): Promise<Response<any>> => {
    const { id } = req.params;
    const { shift } = req.body;
    const period: IPeriod | null = await Period.findOneAndUpdate({_id: id},
      { $push: { "shifts": shift }});
    return res.status(200).json(shift);
  }
  
  deleteEmployeeInPlannig = async (req: Request, res: Response): Promise<Response<any>> => {
    const { id, employee_id } = req.params;

    const period: IPeriod | null = await Period.findOneAndUpdate({_id: id},
      { $pull: {"shifts": { "employee._id": employee_id } } });

    if(!period) throw new GenericError({property:"Periodo", message: 'Periodo no encontrado', type: "RESOURCE_NOT_FOUND"});
    return res.status(200).json({period});
  }
  //********* End New implementation ***********//
  
  getPrintPeriod = async (req: Request, res: Response): Promise<Response<{period: IPeriod, shifts: IShift[]}>> => {
    try{
      const id: string = req.params.id;
      const period: IPeriod | null = await Period.findOne({_id: id});
  
      if(!period) throw new GenericError({property:"Periodo", message: 'Periodo no encontrado', type: "RESOURCE_NOT_FOUND"});
      
      const periodDigest = await this.getDaysObject(period);
      return res.status(200).json(periodDigest);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  updateShifts = async (req: Request, res: Response): Promise<Response<any>> => {
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
  
  updateSigneds = async (req: Request, res: Response): Promise<Response<any>> => {
    const id: string = req.params.id;
    const body: any = await this.filterNullValues(req.body, ['employeeId', 'eventsDay']);
    try{
      // find period
      const period: IPeriod | null = await Period.findOne({_id: id});
      if(!period) throw new GenericError({property:"Periodo", message: 'Periodo no encontrado', type: "RESOURCE_NOT_FOUND"});

      await Promise.all(period.shifts.map( async (shift: IShift, sIndex) => {
        // find correct shift
        if(shift.employee._id.equals(body.employeeId)){
          await Promise.all(shift.events.map((event: IEvent, eIndex) => {
            // LIMIT: event should not been modify
            // find correct event 1
            if(typeof(body.eventsDay[0]) !== 'undefined' && moment(body.eventsDay[0].fromDatetime).isSame(event.fromDatetime) && moment(body.eventsDay[0].toDatetime).isSame(event.toDatetime)){
              period.shifts[sIndex].events[eIndex].checkin = typeof(body.eventsDay[0].checkin) !== 'undefined' ? body.eventsDay[0].checkin : '';
              period.shifts[sIndex].events[eIndex].checkout = typeof(body.eventsDay[0].checkout) !== 'undefined' ? body.eventsDay[0].checkout : '';
              period.shifts[sIndex].events[eIndex].checkinDescription = typeof(body.eventsDay[0].checkinDescription) !== 'undefined' ? body.eventsDay[0].checkinDescription : '';
              period.shifts[sIndex].events[eIndex].checkoutDescription = typeof(body.eventsDay[0].checkoutDescription) !== 'undefined' ? body.eventsDay[0].checkoutDescription : '';
              period.shifts[sIndex].events[eIndex].corrected = !!body.eventsDay[0].corrected;
            }

            // find correct event 2
            if(typeof(body.eventsDay[1]) !== 'undefined' && moment(body.eventsDay[1].fromDatetime).isSame(event.fromDatetime) && moment(body.eventsDay[1].toDatetime).isSame(event.toDatetime)){
              period.shifts[sIndex].events[eIndex].checkin = typeof(body.eventsDay[1].checkin) !== 'undefined' ? body.eventsDay[1].checkin : '';
              period.shifts[sIndex].events[eIndex].checkout = typeof(body.eventsDay[1].checkout) !== 'undefined' ? body.eventsDay[1].checkout : '';
              period.shifts[sIndex].events[eIndex].checkinDescription = typeof(body.eventsDay[1].checkinDescription) !== 'undefined' ? body.eventsDay[1].checkinDescription : '';
              period.shifts[sIndex].events[eIndex].checkoutDescription = typeof(body.eventsDay[1].checkoutDescription) !== 'undefined' ? body.eventsDay[1].checkoutDescription : '';
              period.shifts[sIndex].events[eIndex].corrected = !!body.eventsDay[1].corrected;
            }
          }));
          await createMovement(req.user, 'editó', 'fichado', `de ${shift.employee.firstName} ${shift.employee.lastName}`);
        }
      }));

      await period.save();
      return res.status(200).json({msg: 'Fichaje guardado correctamente'});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      const period: IPeriod | null = await Period.findOneAndDelete({_id: id});
      if(!period) throw new GenericError({property:"Objective", message: 'Objetivo no encontrado', type: "RESOURCE_NOT_FOUND"});
      await createMovement(req.user, 'eliminó', 'período', `Período del objetivo: ${period.objective.name} desde ${period.fromDate} hasta ${period.toDate}`);

      return res.status(200).json("period deleted successfully");
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private getPeriodWithEmployees = async (period: IPeriod): Promise<{periodDigest: IPeriod, shifts: IShift[]}> => {

    // traemos todos los empleados salvo los con la cantidad de eventos y horas a cumplir
    // agregamos parametro para indicar si queremos filtrar por periodo, de esta forma podremos
    // reutilizar la funcion para cuando este armada la planilla de turnos (edicion)
    // pero en ese caso necesitamos al periodo en cuestion con ya con dichos eventos como "other events"
    const shiftsDigest: IShift[] = [];  
    const otherPeriods: IPeriod[] | null = await Period.find(
      {
        $and: [{
          $or: [
          {
            $and: [
              { fromDate: { $lte: period.fromDate } },
              { toDate: {$gte: period.fromDate } }
            ]
          }, {
            $and: [
              { fromDate: { $lte: period.toDate } },
              { toDate: {$gte: period.toDate } }
            ]
          },{
            $and: [
              { fromDate: { $gte: period.fromDate } },
              { toDate: {$lte: period.toDate } }
            ]
          }]
        },{
          _id: { $nin: [ period._id ]}
        }]
      });

    const employees: IEmployee[] | null = await Employee.find({status: { $ne: Status.BAJA}});

    
    await Promise.all(employees.map( async (employee: IEmployee ) => {
      let otherEvents: IEvent[] = [];
      await Promise.all(otherPeriods.map( async (p: IPeriod) => {
        await Promise.all(p.shifts.map((shift: IShift)=> {
          if(employee._id.equals(shift.employee._id)){
            otherEvents.push(...shift.events);
          }
        }));
      }));//end otherPeriods map
      
      // buscamos entres las guardias la que coincida con el empleado
      const shiftFound: number = await Promise.resolve(
        period.shifts.findIndex( (mshift: IShift, mindex: number) => {
          return mshift.employee._id.equals(employee._id);
      }));

      // Si se encontro alguna coincidencia con el empleado, le cargamos los otros eventos de otros objetivos
      if(shiftFound > -1){  
        _.set(period.shifts[shiftFound], 'otherEvents', otherEvents);
      }else{
        // por ultimo armamos el array con los empleados y sus otros eventos en otros objetivos mismo periodo
        shiftsDigest.push({
          employee: {
            _id: employee._id,
            firstName: employee.profile.firstName,
            lastName: employee.profile.lastName,
            avatar: employee.profile.avatar
          },
          events: [],
          otherEvents: otherEvents
        });
      }
    }));
    return {periodDigest: period, shifts: shiftsDigest};
  }


  private getDaysObject = async (period: IPeriod): Promise<Array<string[]>> =>{
    
    
    return await new Promise( (resolve, reject) => {
      
        let fromDate = moment(period.fromDate);
        let toDate = moment(period.toDate);
        
        toDate = toDate.add(1, 'day'); // (while fix) add 1 day
        
        const weeks: Array<string[]> = [];
        let days: string[] = [];
        let weekCounter: number = 0;
        let condition: boolean = (fromDate.isSame(toDate, "day") && fromDate.isSame(toDate, "month") && fromDate.isSame(toDate, "year"));
      
        while(!condition){
        
        days.push(fromDate.format("YYYY-MM-DD"));
        fromDate.add(1, "day");
        
        condition = (fromDate.isSame(toDate, "day") && fromDate.isSame(toDate, "month") && fromDate.isSame(toDate, "year"));
              
        weekCounter++;
        if(weekCounter == 7){
          weeks.push(days);
          days = [];
          weekCounter = 0;
        }else if(condition){
          weeks.push(days);
        }
      }
        resolve(weeks);
    });

  }

  private permitBody = (permit?: string[] | undefined): Array<string> => {
    return permit ? permit : [ 'objective', 'fromDate', 'toDate', 'shifts' ];
  }
}

export default new PeriodController();
