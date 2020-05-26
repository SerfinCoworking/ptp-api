import { Document } from 'mongoose';
// import IPermission from './permission.interface';
import { ObjectID } from 'mongodb';

interface IGrants extends Document {
  resource: string;
  action: string;
  attributes: Array<string>;
}
export default interface IRole extends Document {
  _id: ObjectID;
  name: string;
  grants: IGrants[];
  createdAt?: Date;
  updatedAt?: Date;
}

