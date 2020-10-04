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

class PeriodController extends BaseController{

  create = async (req: Request, res: Response): Promise<Response<any>> => {
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
  
  update = async (req: Request, res: Response): Promise<Response<any>> => {
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

      await period.save();
      return res.status(200).json({message: "Periodo creado correctamente", period: period});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  createShifts = async (req: Request, res: Response): Promise<Response<any>> => {
    const body: any = await this.filterNullValues(req.body, this.permitBody(['employees']));
    const { id } = req.params;
    try{
      const period: IPeriod | null = await Period.findOne({ _id: id });
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

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      await Period.findByIdAndDelete(id);
      return res.status(200).json("period deleted successfully");
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private permitBody = (permit?: string[] | undefined): Array<string> => {
    return permit ? permit : [ 'objective', 'fromDate', 'toDate', 'shifts' ];
  }
}

export default new PeriodController();
