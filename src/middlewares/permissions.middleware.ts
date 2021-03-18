import { Request, Response, NextFunction } from 'express';
import permissions from '../utils/permissions';
import { errorHandler, GenericError } from '../common/errors.handler';
import IUser, { IUserRole, IUserRolePermission } from '../interfaces/user.interface';
import User from '../models/user.model';
import IObjective from '../interfaces/objective.interface';
import Objective from '../models/objective.model';
import { resolve } from 'path';
import Role from '../models/role.model';
import IRole, { IAction } from '../interfaces/role.interface';

// middleware with param
export const hasPermissionIn = (action: string, resource: string) => {
  return async function(req: Request, res: Response, next: NextFunction): Promise<void | Response> {

    try{
      const { _id } = req.user as IUser;

        const user: IUser | null = await User.findOne({ _id }).select('roles'); //try with user
        let canAccess: boolean = false;
        
        if(!user) { 
          //try with objective 
          const objective: IObjective | null = await Objective.findOne({ _id }).select('role'); 
          if(!objective) throw new GenericError({propperty: "User", message: "User not found", type: "RESOURCE_NOT_FOUND"});

          canAccess = await checkByAction(objective.role, action, resource);
        }else{
          canAccess = await checkByAction(user.roles, action, resource);
        }

        if(!canAccess) throw new GenericError({property: "Permissions", message: "You have not permissions to perform this action", type: "FORBIDDEN"})
        

    }catch(err){
      const handler = errorHandler(err);
      return res.status(handler.getCode()).json(handler.getErrors());
    }
    next();
  }
}

const checkByAction = async (roles: Array<IUserRole> | IUserRole, action: string, resource: string): Promise<boolean> => {
  // Validamos primero que el rol y el permiso exista en DB
  const validateRole: boolean = await checkRoleAndPermission(resource, action);
  if(!validateRole) return validateRole;
  
  // Luego validamos que el usuario tenga dichos permisos
  if(Array.isArray(roles)){
    const resourceFound: IUserRole | undefined = await new Promise((resolve, reject) => {
      resolve(roles.find((role: IUserRole) => {
        return role.name === resource;
      }));
    })
    
    if(!resourceFound) return false;

    const actionFound: IUserRolePermission | undefined = await new Promise((resolve, reject) => {
        resolve(resourceFound.permissions.find((permission: IUserRolePermission) => {
        return permission.name === action;
      }));
    });

    if(!actionFound) return false;
  }else{
    
    if(roles.name !== resource) return false;

    const actionFound: IUserRolePermission | undefined = await new Promise((resolve, reject) => {
        resolve(roles.permissions.find((permission: IUserRolePermission) => {
        return permission.name === action;
      }));
    });

    if(!actionFound) return false;
  }
  return true;
}

const checkRoleAndPermission = async (resource: string, action: string): Promise<boolean> => {
  const role: IRole | null = await Role.findOne({name: resource});
  if(!role) return false;
  const result = await new Promise((resolve, reject) =>{
    resolve(role.actions.find((act: IAction) => {
      return act.name === action;
    }));
  });
  
  return !!result;
}