import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Period from '../models/period.model';
import { IPeriod, IShift, IEvent } from '../interfaces/schedule.interface';
import * as _ from 'lodash';
import { createMovement } from '../utils/helpers';

class EventController extends BaseController{

  create = async (req: Request, res: Response): Promise<Response<{period: IPeriod, shifts: IShift[]}>> => {
    const { period_id, employee_id } = req.params;
    const event: IEvent = await this.filterNullValues(req.body, this.permitBody());
    try{
      const period: IPeriod | null = await Period.findOneAndUpdate({_id: period_id},
        { $push: { "shifts.$[outer].events": { ...event } }},
        { 
          arrayFilters: [{"outer.employee._id": employee_id }]
        });

      if(!period) throw new GenericError({property:"Periodo", message: 'Periodo no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json({period});
    }catch(err){
      console.log(err);
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  update = async (req: Request, res: Response): Promise<Response<{period: IPeriod, shifts: IShift[]}>> => {
    const { period_id, employee_id, id } = req.params;
    const event: IEvent = await this.filterNullValues(req.body, this.permitBody());
    try{
      const period: IPeriod | null = await Period.findOneAndUpdate({_id: period_id},
        { $set: { "shifts.$[outer].events.$[event]": { ...event } }},
        { 
          arrayFilters: [
            {"outer.employee._id": employee_id},
            {"event._id": id }
          ]
        });

      if(!period) throw new GenericError({property:"Periodo", message: 'Periodo no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json({period});
    }catch(err){
      console.log(err);
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  delete = async (req: Request, res: Response): Promise<Response<{period: IPeriod, shifts: IShift[]}>> => {
    const { period_id, employee_id, id } = req.params;
    const event: IEvent = await this.filterNullValues(req.body, this.permitBody());
    try{
      const period: IPeriod | null = await Period.findOneAndUpdate({_id: period_id},
        { $pull: { "shifts.$[employee].events": { _id: id } }},
        { 
          arrayFilters: [
            {"employee.employee._id": employee_id}
          ]
        });

      if(!period) throw new GenericError({property:"Periodo", message: 'Periodo no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json({period});
    }catch(err){
      console.log(err);
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  

  private permitBody = (permit?: string[] | undefined): Array<string> => {
    return permit ? permit : ['fromDatetime', 'toDatetime', 'color', 'name'];
  }
}

export default new EventController();
