import { Document } from 'mongoose';

export interface IScheduleTime{
  hour: number;
  minute: number;
}

export interface IScheduleInterval{
  from: IScheduleTime;
  to: IScheduleTime;
}

export interface IScheduleTemplate {
  day: string;
  firstTime: IScheduleInterval;
  secondTime: IScheduleInterval;
}

export default interface ITemplate extends Document{
  name: string;
  schedule: IScheduleTemplate[];
}
