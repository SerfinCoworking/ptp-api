import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Employee from '../models/employee.model';
import IEmployee from '../interfaces/employee.interface';
import { ICalendar, IShift, IPeriod } from '../interfaces/schedule.interface';
import { PaginateResult, PaginateOptions } from 'mongoose';
import moment from 'moment';
import * as _ from 'lodash';

class ShiftController extends BaseController{

  index = async (req: Request, res: Response): Promise<void> => {

    // let period: IPeriod;
    // let objs: ICalendar = {
    //   period: period,
    //   days: []
    // };
    // 2020-06-25
    // 2020-07-24

    const startDate = "2020-07-25";
    const endDate = "2020-08-24";

    // const startDate = "2020-08-25";
    // // const endDate = "2020-09-24";

    // const start = moment(startDate).subtract(1, "day").weekday((0));
    // const end = moment(endDate).add(1, "day").weekday(6);
    // objs.days = this.getDaysObject(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
    // // console.log('here we GO!!!!');
    // // console.log('start', start.format('dddd, MMMM Do YYYY'));
    // // console.log('end', end.format('dddd, MMMM Do YYYY'));
    // return res.status(200).json(objs);

  }

  getDaysObject(from: string, to: string){
    const start = moment(from);
    const end = moment(to).add(1, "day");// fix 1 day more for condition
    const days = [];
    while(!(start.isSame(end, "day") && start.isSame(end, "month") && start.isSame(end, "year"))){
      days.push(start.format("YYYY-MM-DD"));
      start.add(1, "day");
    }
    console.log(days, days.length);
    console.log("End");
    return days;
  }
  // index = async (req: Request, res: Response): Promise<Response<IEmployee[]>> => {
  //   const { search, page, limit, sort } = req.query;

  //   const target: string = await this.searchDigest(search);
  //   const sortDiggest: any = await this.sortDigest(sort, {"profile.firstName": 1, "profile.lastName": 1});

  //   try{
  //     const query = {
  //       $or: [
  //         {"profile.fistName":  { $regex: new RegExp( target, "ig")}},
  //         {"profile.lastName":  { $regex: new RegExp( target, "ig")}},
  //         {"profile.dni":  { $regex: new RegExp( target, "ig")}},
  //         {"contact.email":  { $regex: new RegExp( target, "ig")}}
  //       ]
  //     };
  //     const options: PaginateOptions = {
  //       sort: sortDiggest,
  //       page: (typeof(page) !== 'undefined' ? parseInt(page) : 1),
  //       limit: (typeof(limit) !== 'undefined' ? parseInt(limit) : 10)
  //     };

  //     const employees: PaginateResult<IEmployee> = await Employee.paginate(query, options);
  //     return res.status(200).json(employees);
  //   }catch(err){
  //     const handler = errorHandler(err);
  //     return res.status(handler.getCode()).json(handler.getErrors());
  //   }
  // }

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

export default new ShiftController();
