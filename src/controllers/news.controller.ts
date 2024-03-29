import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import News from '../models/news.model';
import INews, { INewsConcept } from '../interfaces/news.interface';
import { PaginateResult, PaginateOptions } from 'mongoose';
import moment from 'moment';
import Employee from '../models/employee.model';
import IEmployee, { Status } from '../interfaces/employee.interface';
import NewsConcept from '../models/news-concept.model';
import { createMovement } from '../utils/helpers';
import EmployeeStatusModule from '../modules/employeeStatus.module';
import { IRequestQuery } from '../interfaces/request-query,interface';

class NewsController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<INews[]>> => {
    const queryParams: IRequestQuery = req.query as unknown as IRequestQuery;
    const concept: string = req.query.concept as string;
    const dateFrom: string = req.query.dateFrom as string;
    const dateTo: string = req.query.dateTo as string;
    const target: string = await this.searchDigest(queryParams.search);
    const sortDiggest: any = await this.sortDigest(queryParams.sort, {"createdAt": -1});
    try{
      const queryBuilder = [];

      if(concept && concept.length > 0){
        queryBuilder.push({"concept.key": concept});
      }
      
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

      if(target && target.length > 0){
        queryBuilder.push({
          $or: [
            {"employee.profile.lastName":  { $regex: new RegExp( target, "ig")}},
            {"employee.profile.firstName":  { $regex: new RegExp( target, "ig")}},
            {
              "employeeMultiple": {
                $elemMatch: {
                  $or: [
                    {
                      "profile.lastName": { $regex: new RegExp( target, "ig")}
                    },
                    {
                      "profile.firstName": { $regex: new RegExp( target, "ig")}
                    }
                  ]
                }
              }
            }
          ]
        });
      }

      const query = queryBuilder.length ? { $and: queryBuilder } : {};
      const options: PaginateOptions = {
        sort: sortDiggest,
        page: (typeof(queryParams.page) !== 'undefined' ? parseInt(queryParams.page) : 1),
        limit: (typeof(queryParams.limit) !== 'undefined' ? parseInt(queryParams.limit) : 10)
      };

      const news: PaginateResult<INews> = await News.paginate(query, options);
      return res.status(200).json(news);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  newRecord = async (req: Request, res: Response): Promise<Response<IEmployee>> => {
    try{
      const employees: IEmployee[] | null = await Employee.find({status:  { $ne: Status.BAJA}});
      return res.status(200).json(employees);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  getNewsByDate = async (req: Request, res: Response): Promise<Response<INews[]>> => {
    const dateFrom: string = req.query.dateFrom as string;
    const dateTo: string = req.query.dateTo as string;
    // get all news by a period range
    const news: INews[] = await News.find({
      $and: [
        { dateFrom: { $gte: dateFrom } },
        { dateTo: { $lte: dateTo } }
      ]
    });
    return res.status(200).json(news);
  }

  create = async (req: Request, res: Response): Promise<Response<INews>> => {
    const body: INews = await this.filterNullValues(req.body, this.permitBody());
    try{
      const concept: INewsConcept | null = await NewsConcept.findOne({key: body.concept.key});
      if(!concept) throw new GenericError({property:"NewsConcept", message: 'Concepto no encontrado', type: "RESOURCE_NOT_FOUND"});
      body.concept = concept;
      const news: INews = await News.create(body);
      
      if(["BAJA"].includes(news.concept.key)){
        const employee: IEmployee | null = await Employee.findOne({_id: news.employee?._id});
        if(employee){
          const employeeStatus = new EmployeeStatusModule(employee, body.dateFrom);
          await employeeStatus.update();
        }
      }
      await createMovement(req.user, 'creó', 'novedad', `${news.concept.name}`);
      return res.status(200).json(news);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  show = async (req: Request, res: Response): Promise<Response<INews>> => {
    const id: string = req.params.id;
    try{
      const news: INews | null = await News.findOne({_id: id});
      if(!news) throw new GenericError({property:"News", message: 'Novedad no encontrada', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(news);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  update = async (req: Request, res: Response): Promise<Response<INews>> => {
    const id: string = req.params.id;
    const body = await this.filterNullValues(req.body, this.permitBody());
    try{
      const opts: any = { runValidators: true, context: 'query' };
      // find the new
      const newsOld: INews | null = await News.findOne({_id: id});
      if(!newsOld) throw new GenericError({property:"News", message: 'Novedad no encontrada', type: "RESOURCE_NOT_FOUND"});
      
      const employeeOld: IEmployee | null | undefined = await Employee.findOne({_id: newsOld.employee?._id});
      // update news data and old employee o noew employee (if it changed)
      const news: INews = await News.findOneAndUpdate({_id: id}, body, opts) as INews;
      if(!news) throw new GenericError({property:"News", message: 'Novedad no encontrada', type: "RESOURCE_NOT_FOUND"});
      
      if(["BAJA"].includes(news.concept.key)){
        const employee: IEmployee | null = await Employee.findOne({_id: body.employee?._id});
        if(employee){
          const employeeStatus = new EmployeeStatusModule(employee, body.dateFrom, employeeOld);
          await employeeStatus.update();
        }
      }

      await createMovement(req.user, 'editó', 'novedad', `de ${newsOld.concept.name} a ${news.concept.name}`);
      return res.status(200).json(news);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      const news: INews | null = await News.findOneAndDelete({_id: id});
      if(!news) throw new GenericError({property:"News", message: 'Novedad no encontrada', type: "RESOURCE_NOT_FOUND"});
      // "BAJA", update user data
      if(news.concept.key == "BAJA"){
        const employee: IEmployee | null = await Employee.findOne({_id: news.employee?._id});
        if(employee){
          const now = moment();
          employee.status = now.diff(employee.profile.admissionDate, "days") > 30  ?  Status.ACTIVO : Status.ALTA;
          await employee.save();
        }
      }
      if(!news) throw new GenericError({property:"News", message: 'Novedad no encontrada', type: "RESOURCE_NOT_FOUND"});
      await createMovement(req.user, 'eliminó', 'novedad', `${news.concept.name}`);
      return res.status(200).json("news deleted successfully");
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private permitBody = (): Array<string> => {
    return [ 'dateFrom','dateTo','employee', 'employeeMultiple', 'concept', 'reason', 'acceptEventAssign', 'acceptEmployeeUpdate', 'import', 'capacitationHours', 'observation', 'docLink', 'telegramDate' ];
  }
}

export default new NewsController();
