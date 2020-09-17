import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Employee from '../models/employee.model';
import IEmployee from '../interfaces/employee.interface';
import { PaginateResult, PaginateOptions } from 'mongoose';

class EmployeeController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<IEmployee[]>> => {
    const { search, page, limit, sort } = req.query;

    const target: string = await this.searchDigest(search);
    const sortDiggest: any = await this.sortDigest(sort, {"profile.firstName": 1, "profile.lastName": 1});

    try{
      const query = {
        $or: [
          {"profile.fistName":  { $regex: new RegExp( target, "ig")}},
          {"profile.lastName":  { $regex: new RegExp( target, "ig")}},
          {"profile.dni":  { $regex: new RegExp( target, "ig")}},
          {"contact.email":  { $regex: new RegExp( target, "ig")}}
        ]
      };
      const options: PaginateOptions = {
        sort: sortDiggest,
        page: (typeof(page) !== 'undefined' ? parseInt(page) : 1),
        limit: (typeof(limit) !== 'undefined' ? parseInt(limit) : 10)
      };

      const employees: PaginateResult<IEmployee> = await Employee.paginate(query, options);
      return res.status(200).json(employees);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
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
    return [ 'enrollment', 'rfid', 'profile', 'contact' ];
  }
}

export default new EmployeeController();
