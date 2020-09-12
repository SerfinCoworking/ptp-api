import { Request, Response } from 'express';
import * as JWT from 'jsonwebtoken';
import { BaseController } from './base.controllers.interface';
import { errorHandler, GenericError } from '../common/errors.handler';
import { env } from '../config/config';
import { v4 as uuidv4 } from 'uuid';

import IUser from '../interfaces/user.interface';
import User from '../models/user.model';
import IObjective from '../interfaces/objective.interface';
import Objective from '../models/objective.model';

class AuthController extends BaseController{

  public register = async (req: Request, res: Response): Promise<Response> => {
    try{
      const body = await this.filterNullValues(req.body, this.permitBody());
      const newUser = await User.create(body);
      return res.status(200).json(newUser);

    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  public resetPassword = async (req: Request, res: Response): Promise<Response> => {
    const { _id } = req.user as IUser;
    const { oldPassword, newPassword } = req.body;
    try{
      const user: IUser | null = await User.findOne({ _id });
      if(!user) throw new GenericError({property:"User", message: 'User not found', type: "RESOURCE_NOT_FOUND"});

      const isMatch: boolean = await User.schema.methods.isValidPassword(user, oldPassword);
      if(!isMatch) throw new GenericError({property:"User", message: 'Su contraseña actual no coincide con nuestros registros', type: "UNAUTHORIZED"});
      // if(!isMatch) return res.status(401).json({ message: 'Su contraseña actual no coincide con nuestros registros'});

      await user.update({password: newPassword});
      return res.status(200).json('Se ha modificado la contraseña correctamente!');

    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  public login = async (req: Request, res: Response): Promise<Response> => {
    const { _id } = req.user as IUser | IObjective;
    try{

      let user: IUser | IObjective | null = await User.findOne({_id}).select("_id username role loginCount");

      if(!user)  user = await Objective.findOne({_id}).select("_id name role loginCount"); // try to find by objective

      if(!user) throw new GenericError({property: 'User', message:'Debe iniciar sesión', tpye:'EXPECTATION_FAILED'});

      const token = this.signInToken(user._id, user.role);
      const refreshToken = uuidv4();
      const loginCount: number = ++user.loginCount;
      if(user instanceof User){
        await User.updateOne({_id: user._id}, {refreshToken: refreshToken, loginCount: loginCount});
      }else if(user instanceof Objective){
        await Objective.updateOne({_id: user._id}, {refreshToken: refreshToken, loginCount: loginCount});
      }

      return res.status(200).json({
        jwt: token,
        refreshToken: refreshToken
      });

    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  public logout = async (req: Request, res: Response): Promise<Response> => {
    const { refreshToken } = req.body;
    try{
      let user: IUser | IObjective | null = await User.findOne({ refreshToken: refreshToken });
      if(!user) user = await Objective.findOne({ refreshToken: refreshToken });

      if(user instanceof User){
        await User.updateOne({_id: user._id},{refreshToken: ''});
      }else if(user instanceof Objective){
        await Objective.updateOne({_id: user._id},{refreshToken: ''});
      }


      return res.status(204).json({message: 'Logged out successfully!'});
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  public refresh = async (req: Request, res: Response): Promise<Response> => {
    try{
      const refreshTokenBody = req.body.refreshToken;
      const user: IUser | null = await User.findOne({refreshToken: refreshTokenBody }).select("_id username role");

      if(!user) throw new GenericError({property: 'User', message: 'Debe iniciar sesión', type: 'EXPECTATION_FAILED'});

      const token = this.signInToken(user._id, user.role);

      // generate a new refresh_token
      const refreshToken = uuidv4();
      await User.updateOne({_id: user._id}, {refreshToken: refreshToken});
      return res.status(200).json({
        jwt: token,
        refreshToken: refreshToken
      });

    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  show = async (req: Request, res: Response): Promise<Response<IUser>> => {
    try{
      const id: string = req.params.id;
      let user: IUser | IObjective | null = await User.findOne({_id: id}).select("username email role rfid profile");
      if(!user) user = await Objective.findOne({_id: id}).select("identifier role");
      if(!user) throw new GenericError({property:"User", message: 'Usuario no encontrado', type: "RESOURCE_NOT_FOUND"});
      return res.status(200).json(user);
    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }


  private permitBody(): Array<string>{
    return ["username", "email", "password", "role"];
  }

  private signInToken = (userId: string, role: string): any => {
    const token = JWT.sign({
      iss: "ptp",
      sub: userId,
      rl: role,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getDate() + env.TOKEN_LIFETIME)
    }, (process.env.JWT_SECRET || env.JWT_SECRET), {
      algorithm: 'HS256'
    });
    return token;
  }

}

export default new AuthController();
