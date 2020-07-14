import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Schedule from '../models/schedule.model';
import Period from '../models/period.model';
import IEmployee from '../interfaces/employee.interface';
import { ISchedule, IPeriod, ICalendar, ICalendarList } from '../interfaces/schedule.interface';
import { PaginateResult, PaginateOptions } from 'mongoose';
import moment from 'moment';
import * as _ from 'lodash';
import Employee from '../models/employee.model';

class ScheduleController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<ICalendarList>> => {
    const schedules: PaginateResult<ISchedule> = await Schedule.paginate({}, {page: 1, limit: 6});
    const calendars: ICalendar[] = [];
    await Promise.all(schedules.docs.map(async (schedule: ISchedule) => {
      let period: PaginateResult<IPeriod> = await Period.paginate({"objective._id": schedule.objective._id}, { sort: { toDate: -1 }, page: 1, limit: 1 });
      let days = this.getDaysObject(period.docs[0].fromDate, period.docs[0].toDate);
      calendars.push({period: period, days: days} as ICalendar);
    }));
    const calendarList: ICalendarList = { schedules: schedules, calendars: calendars } as ICalendarList;
    return res.status(200).json(calendarList);
  }

  getDaysObject(from: string, to: string){
    // get closest sunday (before)
    const start = moment(from).subtract(1, "day").weekday((0));
    // get closest saturday (after)
    const end = moment(to).add(1, "day").weekday(6).add(1, "day"); // fix 1 day more for condition
    const days = [];
    while(!(start.isSame(end, "day") && start.isSame(end, "month") && start.isSame(end, "year"))){
      days.push(start.format("YYYY-MM-DD"));
      start.add(1, "day");
    }
    console.log(days, days.length);
    console.log("End");
    return days;
  }


  create = async (req: Request, res: Response): Promise<Response<IEmployee>> => {
    const body: IEmployee = await this.filterNullValues(req.body, this.permitBody());
    try{
      const employee: IEmployee = await Employee.create(body);
      return res.status(200).json(employee);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  show = async (req: Request, res: Response): Promise<Response<IEmployee>> => {
    const id: string = req.params.id;
    try{
      const employee: IEmployee | null = await Employee.findOne({_id: id});
      if(!employee) throw new GenericError({property:"Employee", message: 'Emploeado no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(employee);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  update = async (req: Request, res: Response): Promise<Response<IEmployee>> => {
    const id: string = req.params.id;
    const body = await this.filterNullValues(req.body, this.permitBody());
    try{
      const opts: any = { runValidators: true, new: true };
      const employee: IEmployee | null = await Employee.findOneAndUpdate({_id: id}, body, opts);
      if(!employee) throw new GenericError({property:"Employee", message: 'Emploeado no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(employee);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      await Employee.findByIdAndDelete(id);
      return res.status(200).json("Employee deleted successfully");
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private permitBody = (): Array<string> => {
    return [ 'enrollment', 'profile', 'contact' ];
  }
}

export default new ScheduleController();
