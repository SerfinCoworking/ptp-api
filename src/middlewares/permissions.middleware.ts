import { Request, Response, NextFunction } from 'express';
import permissions from '../utils/permissions';
import { errorHandler, GenericError } from '../common/errors.handler';
import IUser from '../interfaces/user.interface';
import User from '../models/user.model';

// middleware with param
export const hasPermissionIn = (action: string, resource: string) => {
  return async function(req: Request, res: Response, next: NextFunction): Promise<void | Response> {

    try{
      const { _id } = req.user as IUser;
      const user: IUser | null = await User.findOne({ _id }).select('role'); //get users roles
      if(!user) throw new GenericError({propperty: "User", message: "User not found", type: "RESOURCE_NOT_FOUND"});

      const canAccess: boolean = await checkByAction(user.role, action, resource);
      if(!canAccess) throw new GenericError({property: "Permissions", message: "You have not permissions to perform this action", type: "FORBIDDEN"})


    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
    next();
  }
}

const checkByAction = async (role: string, action: string, resource: string): Promise<boolean> => {
  const permission = await permissions.can(role).execute(action).on(resource);
  return permission ? permission.granted : true;
}