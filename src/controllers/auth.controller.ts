import { Request, Response } from 'express';
import * as JWT from 'jsonwebtoken';
import { env, httpCodes } from '../config/config';
import { v4 as uuidv4 } from 'uuid';

import IUser from '../interfaces/user.interface';
import User from '../models/user.model';
import { BaseController } from './base.controllers.interface';
import { errorHandler } from '../common/errors.handler';

class AuthController extends BaseController{

  public register = async (req: Request, res: Response): Promise<Response> => {
    try{
      const body = await this.filterNullValues(req.body, this.permitBody());
      const newUser = await User.create(body);
      return res.status(200).json(newUser);

    }catch(e){
      const handler = errorHandler(e);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
  }

  public resetPassword = async (req: Request, res: Response): Promise<Response> => {
    const { _id } = req.user as IUser;
    const { oldPassword, newPassword } = req.body;
    try{
      const user: IUser | null = await User.findOne({ _id });
      if(!user) return res.status(404).json('No se ha encontrado el usuario');
      const isMatch: boolean = await User.schema.methods.isValidPassword(user, oldPassword);
      if(!isMatch) return res.status(401).json({ message: 'Su contraseña actual no coincide con nuestros registros'});

      await user.update({password: newPassword});
      return res.status(200).json('Se ha modificado la contraseña correctamente!');
    }catch(err){
      console.log(err);
      return res.status(500).json('Server Error');
    }
  }

  public login = async (req: Request, res: Response): Promise<Response> => {
    const { _id } = req.user as IUser;
    try{

      const user: IUser | null = await User.findOne({_id}).select("_id username role.name");
      if(user){
        const token = this.signInToken(user._id, user.username, user.role.name);

        const refreshToken = uuidv4();
        await User.updateOne({_id: user._id}, {refreshToken: refreshToken});
        return res.status(200).json({
          jwt: token,
          refreshToken: refreshToken
        });
      }

      return res.status(httpCodes.EXPECTATION_FAILED).json('Debe iniciar sesión');//in the case that not found user
    }catch(err){
      console.log(err);
      return res.status(500).json('Server Error');
    }
  }

  public logout = async (req: Request, res: Response): Promise<Response> => {
    const { refreshToken } = req.body;
    try{
      await User.findOneAndUpdate({ refreshToken: refreshToken }, { refreshToken: '' });
      return res.status(204).json({message: 'Logged out successfully!'});
    }catch(err){
      console.log(err);
      return res.status(500).json("Server error");
    }
  }

  public refresh = async (req: Request, res: Response): Promise<Response> => {
    const refreshToken = req.body.refreshToken;
    try{
      const user: IUser | null = await User.findOne({refreshToken: refreshToken }).select("_id username role.name");

      if(user){

        const token = this.signInToken(user._id, user.username, user.role.name);

        // generate a new refresh_token
        const refreshToken = uuidv4();
        await User.updateOne({_id: user._id}, {refreshToken: refreshToken});
        return res.status(200).json({
          jwt: token,
          refreshToken: refreshToken
        });
      }

      return res.status(httpCodes.EXPECTATION_FAILED).json('Debe iniciar sesión');//in the case that not found user

    }catch(err){
      console.log(err);
      return res.status(500).json('Server error');
    }

  }

  private permitBody(): Array<string>{
    return ["username", "email", "password", "role"];
  }

  private signInToken = (userId: string, username: string, role: string): any => {
    const token = JWT.sign({
      iss: "ptp",
      sub: userId,
      usrn: username,
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
