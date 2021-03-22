import { Request, Response } from 'express';
import { BaseController } from './base.controllers.interface';
import { errorHandler, GenericError } from '../common/errors.handler';
import User from '../models/user.model';
import IUser from '../interfaces/user.interface';
import { PaginateResult, PaginateOptions } from 'mongoose';

class UserController extends BaseController{

  index = async (req: Request, res: Response): Promise<Response<IUser[]>> => {
    const { search, page, limit, sort } = req.query;

    const target: string = await this.searchDigest(search);
    const sortDiggest: any = await this.sortDigest(sort, {"profile.firstName": 1, "profile.lastName": 1});

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
        page: (typeof(page) !== 'undefined' ? parseInt(page) : 1),
        limit: (typeof(limit) !== 'undefined' ? parseInt(limit) : 10)
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
      console.log(body, "DEBUG");
      const user: IUser = await User.create(body);
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
      const opts: any = { runValidators: true, new: true };
      const user: IUser | null = await User.findOneAndUpdate({_id: id}, body, opts);
      if(!user) throw new GenericError({property:"User", message: 'Usuario no encontrado', type: "RESOURCE_NOT_FOUND"});
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
      const user: IUser | null = await User.findOneAndUpdate({_id: id}, body, opts);
      if(!user) throw new GenericError({property:"User", message: 'Usuario no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(user);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  public delete = async (req: Request, res: Response): Promise<Response> => {
    try{
      const { id } = req.params;
      await User.findByIdAndDelete(id);
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
