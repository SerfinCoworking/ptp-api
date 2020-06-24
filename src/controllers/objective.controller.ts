import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Objective from '../models/objective.model';
import IObjective from '../interfaces/objective.interface';
import { PaginateResult, PaginateOptions } from 'mongoose';

class ObjectiveController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<IObjective[]>> => {
    const { search, page, limit, sort } = req.query;

    const target: string = await this.searchDigest(search);
    const sortDiggest: any = await this.sortDigest(sort, {"name": 1});

    try{
      const query = {
        $or: [
          {"name":  { $regex: new RegExp( target, "ig")}}
        ]
      };
      const options: PaginateOptions = {
        sort: sortDiggest,
        page: (typeof(page) !== 'undefined' ? parseInt(page) : 1),
        limit: (typeof(limit) !== 'undefined' ? parseInt(limit) : 10)
      };

      const objective: PaginateResult<IObjective> = await Objective.paginate(query, options);
      return res.status(200).json(objective);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  create = async (req: Request, res: Response): Promise<Response<IObjective>> => {
    const body: IObjective = await this.filterNullValues(req.body, this.permitBody());
    try{
      const objective: IObjective = await Objective.create(body);
      return res.status(200).json(objective);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  show = async (req: Request, res: Response): Promise<Response<IObjective>> => {
    const id: string = req.params.id;
    try{
      const objective: IObjective | null = await Objective.findOne({_id: id});
      if(!objective) throw new GenericError({property:"Objective", message: 'Objetivo no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(objective);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  update = async (req: Request, res: Response): Promise<Response<IObjective>> => {
    const id: string = req.params.id;
    const body = await this.filterNullValues(req.body, this.permitBody());
    try{
      const opts: any = { runValidators: true, new: true };
      const objective: IObjective | null = await Objective.findOneAndUpdate({_id: id}, body, opts);
      if(!objective) throw new GenericError({property:"Objective", message: 'Objetivo no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(objective);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      await Objective.findByIdAndDelete(id);
      return res.status(200).json("Objective deleted successfully");
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private permitBody = (): Array<string> => {
    return [ 'name', 'serviceType', 'address', 'description' ];
  }
}

export default new ObjectiveController();
