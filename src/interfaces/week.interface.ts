import { Document } from 'mongoose';

export default interface IWeek extends Document {
  fromDay: number;
  toDay: number;
  createdAt?: Date;
  updatedAt?: Date;
}
