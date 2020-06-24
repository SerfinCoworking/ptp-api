import { Document } from 'mongoose';
import { ObjectID } from 'mongodb';
import { IAddress, IServiceType } from './embedded.documents.inteface';


export default interface IObjective extends Document {
  _id: ObjectID;
  name: string;
  address: IAddress;
  serviceType: IServiceType[];
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

