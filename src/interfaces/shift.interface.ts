import { Document } from 'mongoose';

export default interface IShift extends Document {
  fromDate: Date;
  toDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
