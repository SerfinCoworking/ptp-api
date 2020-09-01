import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Schedule from '../models/schedule.model';
import Period from '../models/period.model';
import IEmployee from '../interfaces/employee.interface';
import { ISchedule, IPeriod,ICalendarList, IShift, IEvent } from '../interfaces/schedule.interface';
import { PaginateResult, PaginateOptions } from 'mongoose';
import moment from 'moment';
import * as _ from 'lodash';
import Employee from '../models/employee.model';
import Objective from '../models/objective.model';
import IObjective from '../interfaces/objective.interface';
import { ObjectId } from 'mongodb';

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
}

export default new ScheduleController();
