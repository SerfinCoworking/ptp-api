import { Document } from 'mongoose';

export interface IScheduleTemplate {
  day: string;
  firstTime: string;
  secondTime: string;
}

export default interface ITemplate extends Document{
  name: string;
  schedule: IScheduleTemplate[];
}
