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

class NewsController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<INews[]>> => {
    const { search, page, limit, sort } = req.query;

    const target: string = await this.searchDigest(search);
    const sortDiggest: any = await this.sortDigest(sort, {"fromDate": 1});
    try{
        const query = {
          $or: [
            {"concept.name":  { $regex: new RegExp( target, "ig")}},
            {"employee.profile.lastName":  { $regex: new RegExp( target, "ig")}},
            {"employee.profile.firstName":  { $regex: new RegExp( target, "ig")}},
            {"employee.profile.dni":  { $regex: new RegExp( target, "ig")}},
            {"contact.email":  { $regex: new RegExp( target, "ig")}}
          ]
        };
      const options: PaginateOptions = {
        sort: sortDiggest,
        page: (typeof(page) !== 'undefined' ? parseInt(page) : 1),
        limit: (typeof(limit) !== 'undefined' ? parseInt(limit) : 10)
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
    const {dateFrom, dateTo } = req.query;
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
      // "BAJA", update user data
      if(["BAJA", "ALTA", "ACTIVO"].includes(news.concept.key)){
        const employee: IEmployee | null = await Employee.findOne({_id: news.employee?._id});
        if(employee){
          employee.status = news.concept.key;
          await employee.save();
        }
      }
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
      const opts: any = { runValidators: true, new: true };
      // find the new
      const newsOld: INews | null = await News.findOne({_id: id});
      if(!newsOld) throw new GenericError({property:"News", message: 'Novedad no encontrada', type: "RESOURCE_NOT_FOUND"});

      // update employee data of the oldNew
      const employeeOld: IEmployee | null = await Employee.findOne({_id: newsOld.employee?._id});
      if(employeeOld){
        const now = moment();
        employeeOld.status = now.diff(employeeOld.profile.admissionDate, "days") > 30  ?  Status.ACTIVO : Status.ALTA;
        await employeeOld.save();
      }

      // update news data and old employee o noew employee (if it changed)
      const news: INews | null = await News.findOneAndUpdate({_id: id}, body, opts);
      if(!news) throw new GenericError({property:"News", message: 'Novedad no encontrada', type: "RESOURCE_NOT_FOUND"});
      // "BAJA", update user data
      if(news.concept.key == "BAJA"){
        const employee: IEmployee | null = await Employee.findOne({_id: news.employee?._id});
        if(employee){
          employee.status = Status.BAJA;
          await employee.save();
        }
      }

      return res.status(200).json(news);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      const news: INews | null = await News.findOne({_id: id});
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
      await News.findByIdAndDelete(news._id);
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
