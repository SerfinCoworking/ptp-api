import { ObjectId } from "bson";
import { IEvent } from "./schedule.interface";

export interface IPeriodMonitor{
  period: {
    _id: ObjectId;
    fromDate: string;
    toDate: string;
    objective: {
      _id: ObjectId;
      name: string;
    };
  };
  weeksEvents: IMonitorWeekMonth[];
}

export interface IMonitorWeekMonth{
  week: IMonitorWeek[];
}

export interface IMonitorWeek{
  day: IMonitorDay;
}
export interface IMonitorDay{
  date: string;
  dayEvents: IMonitorEmployee[];
}

export interface IMonitorEmployee{
  employee: {
    _id: ObjectId;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  events: IEvent[];
}