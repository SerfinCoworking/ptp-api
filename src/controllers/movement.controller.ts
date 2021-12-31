import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import IMovement from '../interfaces/movement.interface';
import { PaginateResult, PaginateOptions } from 'mongoose';
import _ from 'lodash';
import Movement from '../models/movement.model';
import { IRequestQuery } from '../interfaces/request-query,interface';


class MovementController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<IMovement[]>> => {
    const queryParams: IRequestQuery = req.query as unknown as IRequestQuery;    
    
    const target: string = await this.searchDigest(queryParams.search);
    const sortDiggest: any = await this.sortDigest(queryParams.sort, {"createdAt": -1});
    
    try{
      const query = {
        $or: [
          {"resource":  { $regex: new RegExp( target, "ig")}},
          {"action":  { $regex: new RegExp( target, "ig")}},
          {"user.profile.firstName":  { $regex: new RegExp( target, "ig")}},
          {"user.profile.lastName":  { $regex: new RegExp( target, "ig")}}
        ]
      };
      const options: PaginateOptions = {
        sort: sortDiggest,
        page: (typeof(queryParams.page) !== 'undefined' ? parseInt(queryParams.page) : 1),
        limit: (typeof(queryParams.limit) !== 'undefined' ? parseInt(queryParams.limit) : 10)
      };
      
      const movement: PaginateResult<IMovement> = await Movement.paginate(query, options);
      return res.status(200).json(movement);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  create = async (req: Request, res: Response): Promise<Response<IMovement>> => {
    const body: IMovement = await this.filterNullValues(req.body, this.permitBody());
    try{
      const movement: IMovement = await Movement.create({...body});
      return res.status(200).json(movement);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  show = async (req: Request, res: Response): Promise<Response<IMovement>> => {
    const id: string = req.params.id;
    try{
      const movement: IMovement | null = await Movement.findOne({_id: id});
      if(!movement) throw new GenericError({property:"Movement", message: 'Movimiento no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(movement);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private permitBody = (permit?: string[] | undefined): Array<string> => {
    return permit ? permit : [ 'user', 'action', 'resource', 'target'];
  }
}

export default new MovementController();
