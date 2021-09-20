import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Schedule from '../models/schedule.model';
import Period from '../models/period.model';
import { ISchedule, IPeriod,ICalendarList} from '../interfaces/schedule.interface';
import { PaginateOptions, PaginateResult } from 'mongoose';
import moment from 'moment';
import * as _ from 'lodash';
import Objective from '../models/objective.model';
import IObjective from '../interfaces/objective.interface';
import { createMovement } from '../utils/helpers';

class ScheduleController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<ISchedule>> => {
    const { search, page, limit, sort } = req.query;

    const target: string = await this.searchDigest(search);
    const sortDiggest: any = await this.sortDigest(sort, {"objective.name": 1});
    try{
      const query = {
        $or: [
          {"objective.name":  { $regex: new RegExp( target, "ig")}}
        ]
      };
      const options: PaginateOptions = {
        sort: sortDiggest,
        page: (typeof(page) !== 'undefined' ? parseInt(page) : 1),
        limit: (typeof(limit) !== 'undefined' ? parseInt(limit) : 10)
      };

      const schedules: PaginateResult<ISchedule> = await Schedule.paginate(query, options);
      return res.status(200).json(schedules);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  create = async (req: Request, res: Response): Promise<Response<any>> => {
    
    const body: any = await this.filterNullValues(req.body, this.permitBody(['objective', 'fromDate', 'toDate', 'shifts']));
    try{
      const objective: IObjective | null = await Objective.findOne({_id: body.objective._id}).select("name defaultSchedules");
      if(!objective) throw new GenericError({property:"Objective", message: 'Objetivo no encontrado', type: "RESOURCE_NOT_FOUND"});
      
      let schedule: ISchedule | null = await Schedule.findOne({"objective._id": objective._id}).select('objective');
      if(!schedule) schedule = await Schedule.create({"objective": objective});

      const period: IPeriod = await Period.create(body);
      
      const lastPeriod: IPeriod | null = await Period.findOne({
        'objective._id': schedule.objective._id
      }).sort({toDate: -1});

      if(lastPeriod){
        await schedule.update({
          lastPeriod: lastPeriod?._id,
          lastPeriodMonth: lastPeriod.toDate,
          lastPeriodRange: {
            fromDate: lastPeriod.fromDate,
            toDate: lastPeriod.toDate
          }
        });
      }    
      await createMovement(req.user, 'creó', 'agenda', `Agenda al objetivo: ${schedule.objective.name}`);
      return res.status(200).json({period});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  update = async (req: Request, res: Response): Promise<Response<any>> => {
    const id: string = req.params.id;
    const body: any = await this.filterNullValues(req.body, this.permitBody(['objective', 'fromDate', 'toDate', 'shifts']));
    try{
      const objective: IObjective | null = await Objective.findOne({_id: body.objective._id}).select("name defaultSchedules");
      if(!objective) throw new GenericError({property:"Objective", message: 'Objetivo no encontrado', type: "RESOURCE_NOT_FOUND"});
      
      let schedule: ISchedule | null = await Schedule.findOne({'objective._id': objective._id}).select('objective');
      if(!schedule) throw new GenericError({property:"Schedule", message: 'Agenda no encontrada', type: "RESOURCE_NOT_FOUND"});
      

      const opts: any = { runValidators: true, context: 'query' };
      const period: IPeriod | null = await Period.findOneAndUpdate({_id: id}, body, opts); 
      if(!period) throw new GenericError({property:"Period", message: 'Period no encontrado', type: "RESOURCE_NOT_FOUND"});

      const lastPeriod: IPeriod | null = await Period.findOne({
        'objective._id': schedule.objective._id
      }).sort({toDate: -1});

      if(lastPeriod){
        await schedule.update({
          lastPeriod: lastPeriod?._id,
          lastPeriodMonth: lastPeriod.toDate,
          lastPeriodRange: {
            fromDate: lastPeriod.fromDate,
            toDate: lastPeriod.toDate
          }
        });
      }    
      await createMovement(req.user, 'creó', 'agenda', `Agenda al objetivo: ${schedule.objective.name}`);
      return res.status(200).json({period});
    }catch(err){
      const handler = errorHandler(err);
      console.log(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  show = async (req: Request, res: Response): Promise<Response<ISchedule>> => {
    const id: string = req.params.id;
    try{
      const schedule: ISchedule | null = await Schedule.findOne({_id: id});
      
      if(!schedule) throw new GenericError({property:"Schedule", message: 'Agenda no encontrada', type: "RESOURCE_NOT_FOUND"});

      // const periods = await Period.find({"objective._id": schedule.objective._id}).select('objective fromDate toDate').sort({toDate: -1}).limit(10);
      // const objectives: IObjective[] = await Objective.find().select('name defaultSchedules');
      return res.status(200).json(schedule);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  // ---------------

  private getDaysObject(from: string, to: string){
    // get closest sunday (before)
    const start = moment(from).subtract(1, "day").weekday((0));
    // get closest saturday (after)
    const end = moment(start).add(42, "day");
    const days = [];
    while(!(start.isSame(end, "day") && start.isSame(end, "month") && start.isSame(end, "year"))){
      days.push(start.format("YYYY-MM-DD"));
      start.add(1, "day");
    }
    return days;
  }

  private permitBody = (permit?: string[] | undefined): Array<string> => {
    return permit ? permit : [ 'objective', 'fromDate', 'toDate', 'shifts' ];
  }

}

export default new ScheduleController();
