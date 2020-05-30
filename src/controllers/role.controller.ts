import { Request, Response } from 'express';
import { BaseController } from './base.controllers.interface';
import { errorHandler, GenericError } from '../common/errors.handler';
import Role from '../models/role.model';
import IRole from '../interfaces/role.interface';

class RoleController extends BaseController{

  public index = async (req: Request, res: Response): Promise<Response> => {
    const roles: IRole[] = await Role.find();
    return res.status(200).json({roles});
  }

  public create = async (req: Request, res: Response): Promise<Response> => {
    const body = await this.filterNullValues(req.body, this.permitBody());
    try{
      const newRole: IRole = await Role.create(body);
      return res.status(200).json({ newRole });
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  public show = async (req: Request, res: Response): Promise<Response> => {
    try{
      const id: string = req.params.id;
      const role: IRole | null = await Role.findOne({_id: id});
      if(!role) throw new GenericError({propperty: "Role", message: "Role not found", type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(role);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  public update = async (req: Request, res: Response) => {
    try{
      const id: string = req.params.id;
      const body = await this.filterNullValues(req.body, this.permitBody());

      const opts: any = { runValidators: true, new: true, context: 'query' };
      const role: IRole | null = await Role.findOneAndUpdate({_id: id}, body, opts);
      if(!role) throw new GenericError({propperty: "Role", message: "Role not found", type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(role);
    } catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  public delete = async (req: Request, res: Response): Promise<Response> => {
    try{
      const { id } = req.params;
      await Role.findByIdAndDelete(id);
      return res.status(200).json('deleted');
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  private permitBody(): Array<string>{
    return ["name", "grants"];
  }
}

export default new RoleController();
