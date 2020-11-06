import { Document } from 'mongoose';
import { ObjectID } from 'mongodb';
import { IProfile, IContact } from './embedded.documents.inteface';


export interface IEmployeeLiq extends Document {
  _id: ObjectID;
  enrollment: string;
  firstName: string;
  lastName: string;
  avatar: string;
  dni: string;
}

export default interface ILiquidation extends Document {
  employee: IEmployeeLiq;
  day_hours: number;
  night_hours: number;
  total_hours: number;
  total_extra: number;
  
  createdAt?: Date;
  updatedAt?: Date;
}

