import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Employee from '../models/employee.model';
import IEmployee from '../interfaces/employee.interface';
import { PaginateResult, PaginateOptions } from 'mongoose';
import INews, { INewsConcept } from '../interfaces/news.interface';
import NewsConcept from '../models/news-concept.model';
import News from '../models/news.model';
import { createMovement } from '../utils/helpers';
import { IRequestQuery } from '../interfaces/request-query,interface';
import { ObjectId } from 'mongodb';

class EmployeeController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<IEmployee[]>> => {
    const queryParams: IRequestQuery = req.query as unknown as IRequestQuery;

    const target: string = await this.searchDigest(queryParams.search);
    const sortDiggest: any = await this.sortDigest(queryParams.sort, {"profile.firstName": 1, "profile.lastName": 1});
    try{
      const query = {
        $or: [
          {"profile.firstName":  { $regex: new RegExp( target, "ig")}},
          {"profile.lastName":  { $regex: new RegExp( target, "ig")}},
          {"profile.dni":  { $regex: new RegExp( target, "ig")}},
          {"contact.email":  { $regex: new RegExp( target, "ig")}}
        ]
      };
      const options: PaginateOptions = {
        sort: sortDiggest,
        page: (typeof(queryParams.page) !== 'undefined' ? parseInt(queryParams.page) : 1),
        limit: (typeof(queryParams.limit) !== 'undefined' ? parseInt(queryParams.limit) : 500)
      };

      const employees: PaginateResult<IEmployee> = await Employee.paginate(query, options);
      return res.status(200).json(employees);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  availableEmployees = async (req: Request, res: Response): Promise<Response<IEmployee[]>> => {
    try{
      const employees: IEmployee[] = await Employee.find({
        status: {
          $ne: 'BAJA'
        }
      });
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
      await createMovement(req.user, 'creó', 'empleado', `${employee.profile.lastName} ${employee.profile.lastName}`);
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
      if(!employee) throw new GenericError({property:"Employee", message: 'Empleado no encontrado', type: "RESOURCE_NOT_FOUND"});
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
      const opts: any = { runValidators: true, new: true, context: 'query' };
      const employee: IEmployee = await Employee.findOneAndUpdate({_id: id}, body, opts) as IEmployee;
      if(!employee) throw new GenericError({property:"Employee", message: 'Empleado no encontrado', type: "RESOURCE_NOT_FOUND"});
      await createMovement(req.user, 'editó', 'empleado', `${employee.profile.lastName} ${employee.profile.lastName}`);
      return res.status(200).json(employee);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      const employee: IEmployee | null = await Employee.findOneAndDelete({_id: id});
      if(!employee) throw new GenericError({property:"Employee", message: 'Empleado no encontrado', type: "RESOURCE_NOT_FOUND"});
      await createMovement(req.user, 'eliminó', 'empleado', `${employee.profile.lastName} ${employee.profile.lastName}`);
      
      return res.status(200).json("Employee deleted successfully");
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  updateStatus = async (req: Request, res: Response): Promise<Response<INews>> => {
    const body: INews = await this.filterNullValues(req.body, [ 
    'dateFrom',
    'dateTo',
    'employee',
    'concept',
    'observation' ]);
    const { id } = req.params;
    try{
      const concept: INewsConcept | null = await NewsConcept.findOne({key: body.concept.key});
      if(!concept) throw new GenericError({property:"NewsConcept", message: 'Concepto no encontrado', type: "RESOURCE_NOT_FOUND"});
      body.concept = concept;
      const news: INews = await News.create(body);
      // "BAJA", update user data
      if(["BAJA", "ALTA", "ACTIVO"].includes(news.concept.key)){
        const employee: IEmployee | null = await Employee.findOne({_id: id});
        if(employee){
          employee.status = news.concept.key;
          await employee.save();
          await createMovement(req.user, 'cambió de estado', 'empleado', `${employee.profile.lastName} ${employee.profile.lastName} a ${news.concept.name}`);
        }
      }
      return res.status(200).json(news);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  employeeByRfid = async (req: Request, res: Response): Promise<Response<IEmployee[]>> => {
    const rfid: number = parseInt(req.params.rfid);
    const id: string[] = req.query.id ? [req.query.id?.toString()] : [];
    const queryBuilder = {
      rfid: rfid,
      _id: { $nin:  id }
    };

    const employees: IEmployee[] = await Employee.find(queryBuilder);
    return res.status(200).json(employees);
  }
  
  removeEmployeeRfid = async (req: Request, res: Response): Promise<Response<IEmployee>> => {
    const id: string = req.params.id;

    const employee: IEmployee | null = await Employee.findOneAndUpdate({_id: id}, {
      rfid: undefined
    });
    return res.status(200).json("Se ha desvinculado la tarjeta correctamente");
  }

  private permitBody = (): Array<string> => {
    return [ 'enrollment', 'rfid', 'profile', 'contact' ];
  }
}

export default new EmployeeController();
