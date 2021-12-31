import { Request, Response } from 'express';
import { BaseController } from './base.controllers.interface';
import { errorHandler, GenericError } from '../common/errors.handler';
import User from '../models/user.model';
import IUser from '../interfaces/user.interface';
import { PaginateResult, PaginateOptions } from 'mongoose';
import { createMovement } from '../utils/helpers';
import { IRequestQuery } from '../interfaces/request-query,interface';

class UserController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<IUser[]>> => {
    const queryParams: IRequestQuery = req.query as unknown as IRequestQuery;

    const target: string = await this.searchDigest(queryParams.search);
    const sortDiggest: any = await this.sortDigest(queryParams.sort, {"profile.firstName": 1, "profile.lastName": 1});

    try{
      const query = {
        $or: [
          {"profile.fistName":  { $regex: new RegExp( target, "ig")}},
          {"profile.lastName":  { $regex: new RegExp( target, "ig")}},
          {"profile.dni":  { $regex: new RegExp( target, "ig")}},
        ]
      };
      const options: PaginateOptions = {
        sort: sortDiggest,
        page: (typeof(queryParams.page) !== 'undefined' ? parseInt(queryParams.page) : 1),
        limit: (typeof(queryParams.limit) !== 'undefined' ? parseInt(queryParams.limit) : 10)
      };

      const users: PaginateResult<IUser> = await User.paginate(query, options);
      return res.status(200).json(users);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  show = async (req: Request, res: Response): Promise<Response<IUser>> => {
    try{
      const id: string = req.params.id;
      const user: IUser | null = await User.findOne({_id: id}).select("username email roles rfid profile");
      if(!user) throw new GenericError({property:"User", message: 'Usuario no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(user);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  create = async (req: Request, res: Response): Promise<Response<IUser>> => {
    const body: IUser = await this.filterNullValues(req.body, this.permitBody());
    try{
      const user: IUser = await User.create(body);
      await createMovement(req.user, 'creó', 'usuario', `${user.username}`);
      return res.status(200).json(user);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  update = async (req: Request, res: Response): Promise<Response<IUser>> => {
    const id: string = req.params.id;
    const body = await this.filterNullValues(req.body, this.permitBody());
    try{
      const opts: any = { runValidators: true, new: true, context: 'query' };
      const user: IUser = await User.findOneAndUpdate({_id: id}, body, opts) as IUser;
      if(!user) throw new GenericError({property:"User", message: 'Usuario no encontrado', type: "RESOURCE_NOT_FOUND"});
      await createMovement(req.user, 'editó', 'usuario', `${user.username}`);
      return res.status(200).json(user);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }
  
  updatePermissions = async (req: Request, res: Response): Promise<Response<IUser>> => {
    const id: string = req.params.id;
    const body = await this.filterNullValues(req.body, ['roles']);
    try{
      const opts: any = { runValidators: true, new: true };
      const user: IUser = await User.findOneAndUpdate({_id: id}, body, opts) as IUser;
      if(!user) throw new GenericError({property:"User", message: 'Usuario no encontrado', type: "RESOURCE_NOT_FOUND"});
      await createMovement(req.user, 'actualizó permisos', 'usuario', `${user.username}`);

      return res.status(200).json(user);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  public delete = async (req: Request, res: Response): Promise<Response> => {
    try{
      const { id } = req.params;
      const user: IUser | null = await User.findOneAndDelete({_id: id});
      if(!user) throw new GenericError({property:"User", message: 'Usuario no encontrado', type: "RESOURCE_NOT_FOUND"});
      await createMovement(req.user, 'eliminó', 'usuario', `${user.username}`);

      return res.status(200).json('User deleted successfully');
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private permitBody(): Array<string>{
    return ["username", "email", "password", "rfid", "profile"];
  }
}

export default new UserController();
