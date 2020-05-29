import {Error as MongooseError} from 'mongoose';
import { httpCodes } from '../config/config';

interface IGenericError {
  property: string;
  message: string;
}

class MyCustomError {

  private code: number;
  errors: IGenericError[];

  constructor(){
    this.code = 500;
    this.errors = [];
  }

  setCode(code: number){
    this.code = code;
  }

  getCode(): number{
    return this.code;
  }

  getErrors(): IGenericError[]{
    return this.errors;
  }
}

class ModelError extends Error {
  constructor(args: any){
      super(args);
      this.name = "ModelError"
  }
}

export const errorHandler = (error: any) => {
  const myCustonError = new MyCustomError();

  // catch validation error of mongoose
  if(error instanceof MongooseError.ValidationError){
    myCustonError.setCode(httpCodes.BAD_REQUEST);
    Object.keys(error.errors).forEach(prop => {
      myCustonError.errors.push({property: prop, message: error.errors[prop].message});
    });
  }else{
    myCustonError.errors.push({property: "Server", message: "Server error"});
  }
  return myCustonError;
}
