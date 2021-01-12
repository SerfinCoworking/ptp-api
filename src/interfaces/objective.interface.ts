import { Document } from 'mongoose';
import { ObjectID } from 'mongodb';
import { IAddress, IServiceType, IDefaultSchedule } from './embedded.documents.inteface';

export default interface IObjective extends Document {
  _id: ObjectID;
  name: string;
  identifier: string;
  address: IAddress;
  serviceType: IServiceType[];
  description?: string;
  avatar?: string;
  password: string;
  role:  string;
  refreshToken?: string;
  loginCount: number;
  defaultSchedules: IDefaultSchedule[];
  createdAt?: Date;
  updatedAt?: Date;
}

