import { Document } from 'mongoose';
import { ObjectID } from 'mongodb';

export interface ISignedByPeriod {
  period_id: string;
  employee_id: string;
  signed: Date[];
  objective: {
    _id: string;
    name: string;
  }
}

export default interface IEmployeeSigned extends Document {
  _id: ObjectID;
  employee_liquidated_id: string;
  signed_by_period: ISignedByPeriod[];
  createdAt?: Date;
  updatedAt?: Date;
}

