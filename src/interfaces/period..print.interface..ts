import { ObjectId } from "bson";
import IObjective from "./objective.interface";
import { IEvent } from "./schedule.interface";

export interface IPeriodDay {
  date: string;
  events: Array<IEvent>;
}

export interface IPeriodByEmployeeByWeek{
  employee: {
    _id: ObjectId;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  week: IPeriodDay[];
}

export interface IPeriodWeekGroupByEmployee {
  employeesWeek: IPeriodByEmployeeByWeek[];
}

export interface IPeriodPrint {
  period: {
    _id: ObjectId;
    fromDate: string;
    toDate: string;
    objective: {
      _id: ObjectId;
      name: string;
    };
  };
  objective: IObjective;
  weeksEvents: Array<IPeriodWeekGroupByEmployee>;
}
