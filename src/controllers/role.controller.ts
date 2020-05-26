import { Request, Response } from 'express';
import { BaseController } from './base.controllers.interface';
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
      console.log(err);
      return res.status(500).json('Server Error');
    }
  }

  public show = async (req: Request, res: Response): Promise<Response> => {
    try{
      const id: string = req.params.id;
      const role: IRole | null = await Role.findOne({_id: id});
      return res.status(200).json(role);
    }catch(err){
      console.log(err);
      return res.status(500).json('Server Error');
    }
  }

  public update = async (req: Request, res: Response) => {
    try{
      const id: string = req.params.id;
      const body = await this.filterNullValues(req.body, this.permitBody());

      const opts: any = { runValidators: true, new: true };
      const role: IRole | null = await Role.findOneAndUpdate({_id: id}, body, opts);

      return res.status(200).json(role);
    } catch(err){
      console.log(err);
      return res.status(500).json('Server Error');
    }
  }

  public delete = async (req: Request, res: Response): Promise<Response> => {
    try{

      const { id } = req.params;
      await Role.findByIdAndDelete(id);
      return res.status(200).json('deleted');
    }catch(err){
      console.log(err);
      return res.status(500).json('Server Error');
    }
  }

  private permitBody(): Array<string>{
    return ["name", "grants"];
  }
}

export default new RoleController();
