import { Document } from 'mongoose';
import { ObjectID } from 'mongodb';
import { IProfile, IContact } from './embedded.documents.inteface';


export default interface ICustomer extends Document {
  _id: ObjectID;
  cuit: string;
  profile: IProfile;
  contact: IContact;
  createdAt?: Date;
  updatedAt?: Date;
}

