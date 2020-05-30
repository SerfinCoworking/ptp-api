import {Error as MongooseError} from 'mongoose';
import { HttpCodes } from '../config/config';
import { AccessControlError } from 'role-acl/lib/src/core';



interface IGenericError {
  property: string;
  message: string;
}

// This class permit has one getneric structure of errors as array of error
class CustomHandlerError {

  private code: number = HttpCodes.SERVER_ERROR;
  private errors: IGenericError[] = [];

  setCode(code: number){
    this.code = code;
  }

  getCode(): number{
    return this.code;
  }

  setErrors(error: IGenericError): void{
    this.errors.push(error);
  }

  getErrors(): IGenericError[]{
    return this.errors;
  }
}

// this function mapping every error as defined in, to CustomeHandlerError
export const errorHandler = (error: any): CustomHandlerError => {
  const handler = new CustomHandlerError();

  if(error instanceof MongooseError.ValidationError){
    // mongoose validations
    handler.setCode(HttpCodes.BAD_REQUEST);
    Object.keys(error.errors).forEach(prop => {
      handler.setErrors({property: prop, message: error.errors[prop].message});
    });

  }else if(error instanceof AccessControlError){

    handler.setCode(HttpCodes.FORBIDDEN)
    handler.setErrors({property: "Permissions", message: "You have not permissions to perform this action"});

  }else if(error instanceof GenericError){
    // generic errors
    handler.setCode(error.code)
    handler.setErrors({property: error.property, message: error.message});

  }else{
    // default error
    handler.setErrors({property: "Server", message: "It's not you. It's us. We are having some problems."});
  }

  return handler;
}

export class GenericError extends Error {

  property: string;
  code: number;

  constructor(args: any){
    super(args);
    this.code = HttpCodes[`${args.type}`];
    this.property = args.property;
    this.message = args.message;
  }
}
