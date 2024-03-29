import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import ILiquidation, { ILiquidatedEmployee, ILiquidatedNews } from '../interfaces/liquidation.interface';
import * as _ from 'lodash';
import moment from 'moment';
import INews, { _ljReasons } from '../interfaces/news.interface';
import Liquidation from '../models/liquidation.model';
import { PaginateOptions, PaginateResult } from 'mongoose';
import { createMovement } from '../utils/helpers';
import LiquidationModule from '../modules/liquidation.module';
import LiquidatedNews from '../models/liquidated-news.model';
import EmployeeLiquidated from '../models/employee-liquidated.documents';
import IEmployeeLiquidated from '../interfaces/employee-liquidated.interface';
import { IRequestQuery } from '../interfaces/request-query,interface';

class LiquidationController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<INews[]>> => {
    const queryParams: IRequestQuery = req.query as unknown as IRequestQuery;
    const dateFrom: string = req.query.dateFrom as string;
    const dateTo: string  = req.query.dateTo as string;
    const name: string = req.query.name as string;
    const sortDiggest: any = await this.sortDigest(queryParams.sort, {"dateFrom": -1});
    try{
      const queryBuilder = [];

      if(name && name.length > 0){
        const target: string = await this.searchDigest(name);
        queryBuilder.push({
          "name":  { $regex: new RegExp( target, "ig")}
        });
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

      const query = queryBuilder.length ? { $and: queryBuilder } : {};

      const options: PaginateOptions = {
        sort: sortDiggest,
        page: (typeof(queryParams.page) !== 'undefined' ? parseInt(queryParams.page) : 1),
        limit: (typeof(queryParams.limit) !== 'undefined' ? parseInt(queryParams.limit) : 10),
        select: "name dateFrom dateTo status"
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

  employeeDetail  = async (req: Request, res: Response): Promise<Response<IEmployeeLiquidated>> => {
    const { id, employee_id } = req.params;
    let employeeDetail: IEmployeeLiquidated | null = await EmployeeLiquidated.findOne({liquidation_id: id, "employee._id": employee_id});
    if(!employeeDetail){
      const liquidation: ILiquidation | null = await Liquidation.findOne({_id: id});
      const employee = liquidation?.liquidatedEmployees.find((empLiq: ILiquidatedEmployee) => {
        return empLiq.employee._id.equals(employee_id) 
      });
      
      employeeDetail = await EmployeeLiquidated.create({
        liquidation_id: liquidation?._id,
        dateFrom: liquidation?.dateFrom,
        dateTo: liquidation?.dateTo,
        employee: employee?.employee,
        total_by_hours: employee?.total_by_hours,
        hours_by_working_day: employee?.hours_by_working_day,
        total_of_news: employee?.total_of_news,
        total_viaticos: employee?.total_viaticos,
        lic_justificada_group_by_reason: employee?.lic_justificada_group_by_reason,
        liquidated_news_id: employee?.liquidated_news_id,
      });
    }
    return res.status(200).json(employeeDetail);
  }

  create = async (req: Request, res: Response): Promise<Response<any>> => { 
    const { fromDate, toDate, employeeIds, name, observation } = req.body;
    try{
      if(!employeeIds.length) throw new GenericError({property:"Liquidation", message: 'EMPLOYEE_Debe seleccionar almenos un empleado', type: "RESOURCE_NOT_FOUND"});
      if(!fromDate || !toDate) throw new GenericError({property:"Liquidation", message: 'RANGE_Debe seleccionar una rango de fechas valido', type: "RESOURCE_NOT_FOUND"});
      const dateFrom = moment(fromDate, "YYYY-MM-DD").startOf('day');
      const dateTo = moment(toDate, "YYYY-MM-DD").endOf('day');

      const liq = new LiquidationModule({dateFrom, dateTo}, employeeIds, name, observation);
      await liq.buildAndSave();
      const liquidation: ILiquidation = liq.getLiquidation();
      return res.status(200).json({ message: "Liquidación generada correctamente!", liquidation});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  update = async (req: Request, res: Response): Promise<Response<any>> => { 
    const { id } = req.params;
    const { fromDate, toDate, employeeIds, name, observation } = req.body;
    try{      
      if(!employeeIds.length) throw new GenericError({property:"Liquidation", message: 'EMPLOYEE_Debe seleccionar almenos un empleado', type: "RESOURCE_NOT_FOUND"});
      if(!fromDate || !toDate) throw new GenericError({property:"Liquidation", message: 'RANGE_Debe seleccionar una rango de fechas valido', type: "RESOURCE_NOT_FOUND"});
      const dateFrom = moment(fromDate, "YYYY-MM-DD").startOf('day');
      const dateTo = moment(toDate, "YYYY-MM-DD").endOf('day');

      const liq = new LiquidationModule({dateFrom, dateTo}, employeeIds, name, observation);
      await liq.buildAndSave(id);
      const liquidation: ILiquidation = liq.getLiquidation();
      return res.status(200).json({ message: "Liquidación generada correctamente!", liquidation});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  close = async (req: Request, res: Response): Promise<Response<any>> => { 
    const { id } = req.params;  
    try{
      const opts: any = { runValidators: true, new: true };
      const liquidation: ILiquidation = await Liquidation.findOneAndUpdate({_id: id, status: "IN_PROCESS"}, {status: 'CLOSED'}, opts) as ILiquidation;
      if (!liquidation) throw new GenericError({property:"Liquidation", message: 'Liquidación no encontrada', type: "RESOURCE_NOT_FOUND"});
      // liquidation.status = 'CLOSED';
      // await liquidation.save;
      return res.status(200).json({message: "Liquidación cerrada correctamente!", liquidation})
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  liquidatedNews = async (req: Request, res: Response): Promise<Response<ILiquidatedNews | null>> => {   
    const {id} = req.params;
    try{
      const liquidatedNews: ILiquidatedNews | null = await LiquidatedNews.findOne({_id: id});
      return res.status(200).json(liquidatedNews);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      const liq: ILiquidation | null = await Liquidation.findOne({_id: id});
      if(!liq) throw new GenericError({property:"Liquidation", message: 'Liquidación no encontrada', type: "RESOURCE_NOT_FOUND"});
      if(liq.status === 'CLOSED') throw new GenericError({property:"Liquidation", message: 'No es posible eliminar esta liquidación', type: "RESOURCE_NOT_FOUND"});
      const liqMod = new LiquidationModule({dateFrom: moment(), dateTo: moment()}, [], '');
      const {dateFrom, dateTo} = await liqMod.destroyLiquidation(liq);
      const fromDateMoment = moment(dateFrom, "YYYY-MM-DD");
      const toDateMoment = moment(dateTo, "YYYY-MM-DD");
      await liq.remove();
      await createMovement(req.user, 'eliminó', 'liquidación', `Liquidación desde ${fromDateMoment.format("DD_MM_YYYY")} hasta ${toDateMoment.format("DD_MM_YYYY")}`);
      return res.status(200).json("liquidation deleted successfully");
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private permitBody = (permit?: string[] | undefined): Array<string> => {
    return permit ? permit : [ 'objective', 'fromDate', 'toDate', 'shifts' ];
    }
}

export default new LiquidationController();
