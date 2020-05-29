import { Document } from 'mongoose';
import { ObjectID } from 'mongodb';
import { IProfile, IContact } from './embedded.documents.inteface';


export default interface IEmployee extends Document {
  _id: ObjectID;
  enrollment: string;
  profile: IProfile;
  contact: IContact;
  createdAt?: Date;
  updatedAt?: Date;
}

