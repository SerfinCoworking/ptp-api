import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import News from '../models/news.model';
import INews from '../interfaces/news.interface';
import { PaginateResult, PaginateOptions } from 'mongoose';
import moment from 'moment';

class NewsController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<INews[]>> => {
    const { search, page, limit, sort } = req.query;

    const target: string = await this.searchDigest(search);
    const sortDiggest: any = await this.sortDigest(sort, {"fromDate": 1});
    try{
        const query = {
          $or: [
            {"concept.name":  { $regex: new RegExp( target, "ig")}},
            {"target.profile.lastName":  { $regex: new RegExp( target, "ig")}},
            {"target.profile.firstName":  { $regex: new RegExp( target, "ig")}},
            {"target.profile.dni":  { $regex: new RegExp( target, "ig")}},
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
      const news: INews = await News.create(body);
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
      const news: INews | null = await News.findOneAndUpdate({_id: id}, body, opts);
      if(!news) throw new GenericError({property:"News", message: 'Novedad no encontrada', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(news);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      await News.findByIdAndDelete(id);
      return res.status(200).json("news deleted successfully");
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private permitBody = (): Array<string> => {
    return [ 'dateFrom','dateTo','target','concept','reason','acceptEventAssign','acceptEmployeeUpdate','import','observation' ];
  }
}

export default new NewsController();