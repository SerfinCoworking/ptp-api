import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Customer from '../models/employee.model';
import ICustomer from '../interfaces/employee.interface';
import { PaginateResult, PaginateOptions } from 'mongoose';

class CustomerController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<ICustomer[]>> => {
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
        page: (typeof(page) !== 'undefined' ? page : 1),
        limit: (typeof(limit) !== 'undefined' ? limit : 10)
      };

      const employees: PaginateResult<ICustomer> = await Customer.paginate(query, options);
      return res.status(200).json(employees);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  create = async (req: Request, res: Response): Promise<Response<ICustomer>> => {
    const body: ICustomer = await this.filterNullValues(req.body, this.permitBody());
    try{
      const employee: ICustomer = await Customer.create(body);
      return res.status(200).json(employee);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  show = async (req: Request, res: Response): Promise<Response<ICustomer>> => {
    const id: string = req.params.id;
    try{
      const employee: ICustomer | null = await Customer.findOne({_id: id});
      if(!employee) throw new GenericError({property:"Customer", message: 'Cliente no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(employee);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  update = async (req: Request, res: Response): Promise<Response<ICustomer>> => {
    const id: string = req.params.id;
    const body = await this.filterNullValues(req.body, this.permitBody());
    try{
      const opts: any = { runValidators: true, new: true };
      const employee: ICustomer = await Customer.findOneAndUpdate({_id: id}, body, opts) as ICustomer;
      if(!employee) throw new GenericError({property:"Customer", message: 'Cliente no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(employee);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      await Customer.findByIdAndDelete(id);
      return res.status(200).json("Customer deleted successfully");
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private permitBody = (): Array<string> => {
    return [ 'enrollment', 'profile', 'contact' ];
  }
}

export default new CustomerController();
