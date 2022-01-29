import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { PaginateResult } from 'mongoose';


export interface IEvent{
  _id?: ObjectId;
  fromDatetime: Date;
  toDatetime: Date;
  checkin?: Date;
  checkinDescription?: string;
  checkout?: Date;
  checkoutDescription?: string;
  corrected?: boolean;
  checkin_corrected?: boolean;
  checkout_corrected?: boolean;
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
    hex: string;
    rgba: string;
  };
  name: string;
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
    avatar: string;
  };
  events: IEvent[];
  signed?: Date[];
  otherEvents?: IEvent[];
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
  lastPeriod: ObjectId;
  lastPeriodMonth: string;
  lastPeriodRange: {
    fromDate: string;
    toDate: string;
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
