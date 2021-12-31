import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Schedule from '../models/schedule.model';
import Period from '../models/period.model';
import { ISchedule, IPeriod,ICalendarList} from '../interfaces/schedule.interface';
import { PaginateResult } from 'mongoose';
import moment from 'moment';
import * as _ from 'lodash';
import Objective from '../models/objective.model';
import IObjective from '../interfaces/objective.interface';
import { createMovement } from '../utils/helpers';

class ScheduleDepController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<ICalendarList>> => {
    const {schedulePage, periodPage, objectiveId } = req.query;
 
    const sPage: number = schedulePage ? parseInt(schedulePage as string) : 1;
    
    try{
  
      const schedules: PaginateResult<ISchedule> = await Schedule.paginate({}, {page: sPage, limit: 6, sort: {"objective.name": 1}});
      const calendarList: ICalendarList = {
        docs: [],
        total: schedules.total,
        limit: schedules.limit,
        page: schedules.page,
        pages: schedules.pages,
        offset: schedules.offset,
      };
      await Promise.all(schedules.docs.map(async (schedule: ISchedule) => {
        const pPage: number = periodPage && schedule.objective._id.equals(objectiveId as string) ? parseInt(periodPage as string) : 1;
        
        let period: PaginateResult<IPeriod> = await Period.paginate({"objective._id": schedule.objective._id}, { sort: { toDate: -1 }, page: pPage, limit: 1 });
        let days: string[] = [];
        if(period.total > 0){
          days = this.getDaysObject(period.docs[0].fromDate, period.docs[0].toDate);
        }
        calendarList.docs.push({schedule, period, days});// set nested items
      }));

      return res.status(200).json(calendarList);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  getScheduleById = async (req: Request, res: Response): Promise<Response<ICalendarList>> => {
    const { id } = req.params; 
    const {periodPage, objectiveId } = req.query; 
    
    try{
  
      const schedule: ISchedule | null = await Schedule.findOne({_id: id});
      const calendarList: ICalendarList = {
        docs: [],
        total: 1,
        limit: 1,
        page: 1,
        pages: 1
      };

      if(!schedule) throw new GenericError({property:"Schedule", message: 'Agenda no encontrada', type: "RESOURCE_NOT_FOUND"});
      
      const pPage: number = periodPage ? parseInt(periodPage as string) : 1;

      let period: PaginateResult<IPeriod> = await Period.paginate({"objective._id": schedule.objective._id}, { sort: { toDate: -1 }, page: pPage, limit: 1 });
      let days: string[] = [];
      if(period.total > 0){
        days = this.getDaysObject(period.docs[0].fromDate, period.docs[0].toDate);
      }
      calendarList.docs.push({schedule, period, days});// set nested items

      return res.status(200).json(calendarList);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  newRecord = async (req: Request, res :Response): Promise<Response<any>> => {
    try{
      // get objectives and employees
      const objectives: IObjective[] = await Objective.find().select('name');
      return res.status(200).json(objectives);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }


  create = async (req: Request, res: Response): Promise<Response<any>> => {
    const body: any = await this.filterNullValues(req.body, this.permitBody(['objective']));
    try{
      const objective: IObjective | null = await Objective.findOne({_id: body.objective}).select("name defaultSchedules");
      if(!objective) throw new GenericError({property:"Objective", message: 'Objetivo no encontrado', type: "RESOURCE_NOT_FOUND"});
      
      let schedule: ISchedule | null = await Schedule.findOne({"objective._id": objective._id}).select('objective');
      let periods: IPeriod[];
      
      if(!schedule){
        schedule = await Schedule.create({"objective": objective});
        periods = [];
      }else{
        periods = await Period.find({"objective._id": objective._id}).select('objective fromDate toDate').sort({toDate: -1}).limit(10);
      }
      await createMovement(req.user, 'creó', 'agenda', `Agenda al objetivo: ${schedule.objective.name}`);
      return res.status(200).json({schedule, objective, periods});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  show = async (req: Request, res: Response): Promise<Response<ISchedule>> => {
    const id: string = req.params.id;
    try{
      const schedule: ISchedule | null = await Schedule.findOne({_id: id});
      
      if(!schedule) throw new GenericError({property:"Schedule", message: 'Agenda no encontrada', type: "RESOURCE_NOT_FOUND"});

      const periods = await Period.find({"objective._id": schedule.objective._id}).select('objective fromDate toDate').sort({toDate: -1}).limit(10);
      const objectives: IObjective[] = await Objective.find().select('name defaultSchedules');
      return res.status(200).json({schedule, periods, objectives});
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

export default new ScheduleDepController();
