import { Document } from 'mongoose';
// import IPermission from './permission.interface';
import { ObjectID } from 'mongodb';

export interface IAction extends Document {
  name: string;
}
export default interface IRole extends Document {
  _id: ObjectID;
  name: string;
  actions: Array<IAction>;
  createdAt?: Date;
  updatedAt?: Date;
}

