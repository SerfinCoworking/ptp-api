import { Document } from 'mongoose';
import { ObjectID } from 'mongodb';
import { IProfile, IContact } from './embedded.documents.inteface';


export enum Status { 
  ALTA = 'ALTA', 
  ACTIVO = 'ACTIVO', 
  BAJA = 'BAJA'
}

export default interface IEmployee extends Document {
  _id: ObjectID;
  enrollment: string;
  rfid: number;
  status:  string;
  profile: IProfile;
  contact: IContact;
  createdAt?: Date;
  updatedAt?: Date;
}

