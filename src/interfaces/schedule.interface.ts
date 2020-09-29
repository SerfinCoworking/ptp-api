import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { PaginateResult } from 'mongoose';


export interface IEvent{
  fromDatetime: Date;
  toDatetime: Date;
  checkin?: Date;
  checkout?: Date;
}

export interface ISigned{
  event: IEvent;
  eventIndex: number;
}

export interface IShift{
  employee: {
    _id: ObjectId;
    firstName: string;
    lastName: string;
  };
  events: IEvent[];
  signed?: Date[];
}

export interface IPeriod extends Document {
  _id: ObjectId;
  fromDate: string;
  toDate: string;
  shifts: IShift[];
  objective: {
    _id: ObjectId;
    name: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
  validatePeriod(period: IPeriod): Promise<boolean>;
}
// schedule: ISchedule;

export interface ISchedule extends Document {
  _id: ObjectId;
  objective: {
    _id: ObjectId;
    name: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICalendarBuilder {
  schedule: ISchedule;
  period: PaginateResult<IPeriod>;
  days: string[];
}
export interface ICalendarList {
  docs: ICalendarBuilder[];
  total: number;
  limit: number;
  page?: number;
  pages?: number;
  offset?: number;
}
