import { Document } from 'mongoose';
import { ObjectID } from 'mongodb';
import { IAddress, IServiceType } from './embedded.documents.inteface';


export default interface IObjective extends Document {
  _id: ObjectID;
  name: string;
  identifier: string;
  address: IAddress;
  serviceType: IServiceType[];
  description: string;
  password: string;
  role:  string;
  refreshToken?: string;
  loginCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

