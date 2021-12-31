import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import Objective from '../models/objective.model';
import IObjective from '../interfaces/objective.interface';
import { PaginateResult, PaginateOptions } from 'mongoose';
import _ from 'lodash';
import { createMovement } from '../utils/helpers';
import { IRequestQuery } from '../interfaces/request-query,interface';


class ObjectiveController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<IObjective[]>> => {
    const queryParams: IRequestQuery = req.query as unknown as IRequestQuery;
   
    const target: string = await this.searchDigest(queryParams.search);
    const sortDiggest: any = await this.sortDigest(queryParams.sort, {"name": 1});
    
    try{
      const query = {
        $or: [
          {"name":  { $regex: new RegExp( target, "ig")}}
        ]
      };
      const options: PaginateOptions = {
        select: '_id name identifier address serviceType description avatar defaultSchedules createdAt updatedAt',
        sort: sortDiggest,
        page: (typeof(queryParams.page) !== 'undefined' ? parseInt(queryParams.page) : 1),
        limit: (typeof(queryParams.limit) !== 'undefined' ? parseInt(queryParams.limit) : 10)
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
      const objective: IObjective = await Objective.create({
        ...body,
        status: 'DISABLED',
        role: {name: 'objective', permissions: [{name: 'signed'}]} 
      });
      await createMovement(req.user, 'creó', 'objetivo', `${objective.name}`);
      return res.status(200).json(objective);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  show = async (req: Request, res: Response): Promise<Response<IObjective>> => {
    const id: string = req.params.id;
    try{
      const objective: IObjective | null = await Objective.findOne({_id: id}).select("_id name address serviceType description avatar identifier defaultSchedules");
      if(!objective) throw new GenericError({property:"Objective", message: 'Objetivo no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(objective);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  update = async (req: Request, res: Response): Promise<Response<IObjective>> => {
    const id: string = req.params.id;
    const body: any = await this.filterNullValues(req.body, this.permitBody());
    if(_.isEmpty(body.password)) delete body.password;

    try{
      const opts: any = { runValidators: true, new: true, context: 'query' };
      const objective: IObjective = await Objective.findOneAndUpdate({_id: id}, body, opts) as IObjective;
      if(!objective) throw new GenericError({property:"Objective", message: 'Objetivo no encontrado', type: "RESOURCE_NOT_FOUND"});
      await createMovement(req.user, 'editó', 'objetivo', `${objective.name}`);
      return res.status(200).json(objective);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try{
      const objective: IObjective | null = await Objective.findOneAndDelete({_id: id});
      if(!objective) throw new GenericError({property:"Objective", message: 'Objetivo no encontrado', type: "RESOURCE_NOT_FOUND"});
      await createMovement(req.user, 'eliminó', 'objetivo', `${objective.name}`);
      return res.status(200).json("Objective deleted successfully");
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  passwordReset = async (req: Request, res: Response): Promise<Response<IObjective>> => {
    const id: string = req.params.id;
    const { password } = req.body;
    try{
      const opts: any = { runValidators: true, new: true, context: 'query' };
      const objective: IObjective = await Objective.findOneAndUpdate({_id: id}, {password: password, status: 'ENABLED'}, opts) as IObjective;
      if(!objective) throw new GenericError({property:"Objective", message: 'Objetivo no encontrado', type: "RESOURCE_NOT_FOUND"});
      await createMovement(req.user, 'cambió contraseña', 'objetivo', `${objective.name}`);
      return res.status(200).json(objective);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private permitBody = (permit?: string[] | undefined): Array<string> => {
    return permit ? permit : [ 'name', 'serviceType', 'address', 'description', 'identifier', 'avatar' , 'defaultSchedules'];
  }
}

export default new ObjectiveController();
