import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Period from '../models/period.model';
import IEmployee from '../interfaces/employee.interface';
import ILiquidation from '../interfaces/liquidation.interface';
import { IPeriod, IShift, IEvent} from '../interfaces/schedule.interface';
import * as _ from 'lodash';
import Employee from '../models/employee.model';
import moment from 'moment';
import News from '../models/news.model';
import INews, { _ljReasons } from '../interfaces/news.interface';
import Liquidation from '../models/liquidation.model';
import { PaginateOptions, PaginateResult } from 'mongoose';
import { createMovement } from '../utils/helpers';
import LiquidationModule from '../modules/liquidation.module';

class LiquidationController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<INews[]>> => {
    const { search, page, limit, sort } = req.query;

    const target: string = await this.searchDigest(search);
    const sortDiggest: any = await this.sortDigest(sort, {"dateFrom": 1});
    try{
        const query = {
          $or: [
            {"dateFrom":  { $regex: new RegExp( target, "ig")}},
            {"dateTo":  { $regex: new RegExp( target, "ig")}},
          ]
        };
      const options: PaginateOptions = {
        sort: sortDiggest,
        page: (typeof(page) !== 'undefined' ? parseInt(page) : 1),
        limit: (typeof(limit) !== 'undefined' ? parseInt(limit) : 10),
        select: "dateFrom dateTo"
      };

      const liquidations: PaginateResult<ILiquidation> = await Liquidation.paginate(query, options);
      return res.status(200).json(liquidations);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  show = async (req: Request, res: Response): Promise<Response<ILiquidation>> => {
    const id: string = req.params.id;
    try{
      const liquidation: ILiquidation | null = await Liquidation.findOne({_id: id});
      if(!liquidation) throw new GenericError({property:"Liquidation", message: 'Liquidación no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(liquidation);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  new = async (req: Request, res: Response): Promise<Response<ILiquidation>> => { 
    const { fromDate, toDate, employeeSearch, employeeIds } = req.query;
    const dateFrom = moment(fromDate, "DD_MM_YYYY").startOf('day');
    const dateTo = moment(toDate, "DD_MM_YYYY").endOf('day');
    const liq = new LiquidationModule({dateFrom, dateTo}, employeeIds);
    await liq.buildAndSave();
    const liquidation: ILiquidation = liq.getLiquidation();
    return res.status(200).json(liquidation);
  }

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      const liq: ILiquidation | null = await Liquidation.findOneAndDelete({_id: id});
      if(!liq) throw new GenericError({property:"Liquidation", message: 'Liquidación no encontrado', type: "RESOURCE_NOT_FOUND"});
      const fromDateMoment = moment(liq.dateFrom);
      const toDateMoment = moment(liq.dateTo);
      await createMovement(req.user, 'eliminó', 'liquidación', `Liquidación desde ${fromDateMoment.format("DD_MM_YYYY")} hasta ${toDateMoment.format("DD_MM_YYYY")}`);
      return res.status(200).json("liquidation deleted successfully");
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private calculateHours = (news: INews, employee: IEmployee, from: moment.Moment, to: moment.Moment): number => {
    let total:number = 0;
    // si el la fecha de incio del evento se encuentra comprendida por las fechas del feriado
    // entonces calculamos las horas 
    // a tener en cuenta: que hay que tomar los minutos y no solo las horas
    if(typeof(news.employee) === 'undefined' || news.employee?._id.equals(employee._id)){
      if(from.isBetween(news.dateFrom, news.dateTo, "date", "[]") && to.isBetween(news.dateFrom, news.dateTo, "date", "[]")){
        total += to.diff(from, 'hours');
      }else if(from.isBetween(news.dateFrom, news.dateTo, "date", "[]")){
        // se agregar 1 dia mas ya que los minutos no los toma como hora
        const newsEnd = moment(news.dateTo).add(1, 'day').startOf('day');
        total += newsEnd.diff(from, 'hours');
      }else if(to.isBetween(news.dateFrom, news.dateTo, "date", "[]")){
        const newsStart = moment(news.dateFrom).startOf('day');
        total += to.diff(newsStart, 'hours');
      }
    }

    return total;
  }
  
  private calculateDays = (news: INews, employee: IEmployee, from: moment.Moment, to: moment.Moment): number => {
    let total:number = 0;
    const newsDateFrom: moment.Moment = moment(news.dateFrom).startOf('day');
    const newsDateTo: moment.Moment = moment(news.dateTo).endOf('day');
    // si el la fecha de incio del evento se encuentra comprendida por las fechas del feriado
    // entonces calculamos las horas 
    // a tener en cuenta: que hay que tomar los minutos y no solo las horas
    if(typeof(news.employee) === 'undefined' || news.employee?._id.equals(employee._id)){
      if(newsDateFrom.isBetween(from, to, "date", "[]") && newsDateTo.isBetween(from, to, "date", "[]")){
        newsDateTo.add(1, 'day');
        total += newsDateTo.diff(newsDateFrom, 'days');
      }else if(newsDateFrom.isBetween(from, to, "date", "[]")){
        to.add(1, 'day');
        total += newsDateFrom.diff(to, 'days');
      }else if(newsDateTo.isBetween(from, to, "date", "[]")){
        from.add(1, 'day');
        total += newsDateTo.diff(from, 'days');
      }
    }
    return total;
  }
  
  private calculateImport = (news: INews, employee: IEmployee, from: moment.Moment, to: moment.Moment): number => {
    let total:number = 0;
    const newsDateFrom: moment.Moment = moment(news.dateFrom).startOf('day');
    // sumamos los adelantos recibidos
    if(typeof(news.employee) === 'undefined' || news.employee?._id.equals(employee._id)){
      if(newsDateFrom.isBetween(from, to, "date", "[]") && news.import){
        total += news.import;
      }
    }
    return total;
  }

  private permitBody = (permit?: string[] | undefined): Array<string> => {
    return permit ? permit : [ 'objective', 'fromDate', 'toDate', 'shifts' ];
    }
}

export default new LiquidationController();
