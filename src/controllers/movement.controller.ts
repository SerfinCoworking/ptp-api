import { Request, Response } from 'express';
import { errorHandler, GenericError } from '../common/errors.handler';
import { BaseController } from './base.controllers.interface';
import IMovement from '../interfaces/movement.interface';
import { PaginateResult, PaginateOptions } from 'mongoose';
import _ from 'lodash';
import Movement from '../models/movement.model';


class MovementController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<IMovement[]>> => {
    const { search, page, limit, sort } = req.query;
    
    const target: string = await this.searchDigest(search);
    const sortDiggest: any = await this.sortDigest(sort, {"createdAt": -1});
    
    try{
      const query = {
        $or: [
          {"resource":  { $regex: new RegExp( target, "ig")}}
        ]
      };
      const options: PaginateOptions = {
        sort: sortDiggest,
        page: (typeof(page) !== 'undefined' ? parseInt(page) : 1),
        limit: (typeof(limit) !== 'undefined' ? parseInt(limit) : 10)
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
