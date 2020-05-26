import { Request, Response } from 'express';
import { BaseController } from './base.controllers.interface';
import User from '../models/user.model';
import IUser from '../interfaces/user.interface';

class UserController extends BaseController{

  public index = async (req: Request, res: Response): Promise<Response> => {
    const users: IUser[] = await User.find().select("username email role");
    return res.status(200).json({users});
  }

  public show = async (req: Request, res: Response): Promise<Response> => {
    try{
      const id: string = req.params.id;
      const user: IUser | null = await User.findOne({_id: id}).select("username email role");
      return res.status(200).json(user);
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
      const role: IUser | null = await User.findOneAndUpdate({_id: id}, body, opts).select("username email role");

      return res.status(200).json(role);
    } catch(err){
      console.log(err);
      return res.status(500).json('Server Error');
    }
  }

  public delete = async (req: Request, res: Response): Promise<Response> => {
    try{

      const { id } = req.params;
      await User.findByIdAndDelete(id);
      return res.status(200).json('User deleted successfully');
    }catch(err){
      console.log(err);
      return res.status(500).json('Server Error');
    }
  }

  private permitBody(): Array<string>{
    return ["username", "email", "password", "role"];
  }
}

export default new UserController();
