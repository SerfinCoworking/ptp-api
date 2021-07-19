import { Document } from 'mongoose';
import { ObjectID } from 'mongodb';
import INews from './news.interface';
import { IEvent } from './schedule.interface';

export interface IEmployeeLiq extends Document {
  _id: ObjectID;
  enrollment: string;
  firstName: string;
  lastName: string;
  avatar: string;
  dni: string;
  cuilPrefix: string;
  cuilDni: string;
  cuilSufix: string;
  function: string;
  employer: string;
  art: string;
}

export interface IEventWithObjective {
  event: IEvent,
  objectiveName: string;
  diffInHours: number;
  dayHours: number;
  nightHours: number;
  feriadoHours: number;
}
export interface IHoursByWeek {
  from: string;
  to: string;
  totalHours: number;
  totalExtraHours: number;
  events?: IEventWithObjective[];
}

export interface ILicReason {
  key: string;
  name: string;
  assigned_hours: number
};

// ==================== V2 ======================
export default interface ILiquidation extends Document {
  dateFrom: string;
  dateTo: string;
  liquidatedEmployees: ILiquidatedEmployee[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PeriodRangeDate {
  dateFrom: moment.Moment;
  dateTo: moment.Moment;
}

export interface CalculatedHours {
  total: number;
  by: {day: number; night: number};
  extras: number;
}

export interface ILiquidatedEmployee {
  employee: IEmployeeLiq;
  total_by_hours: {
    signed: CalculatedHours;
    schedule: CalculatedHours;
    news: {
      feriado: number;
      suspension: number;
      lic_justificada: number;
      lic_no_justificada: number;
      art: number;
      capacitaciones: number;
    };
    by_week: IHoursByWeek[];
  },
  hours_by_working_day: {

    lic_justificadas: Array<string>;
    lic_no_justificas: Array<string>;
    suspension: Array<string>;
    art: Array<string>;
  },
  total_of_news: {
    vaciones_by_days: number;
    adelanto_import: number;
    plus_responsabilidad: number;
    lic_sin_sueldo_by_days: number;
    presentismo: number;
    embargo: number;
  }
  total_viaticos: number;

  lic_justificada_group_by_reason: ILicReason[],
  currentStatus: INews;
  liquidated_news: ILiquidatedNews;
}

export interface ILiquidatedNews {
  _id?: ObjectID;
  arts: INews[];
  capacitaciones: INews[];
  plus_responsabilidad: INews[];
  suspensiones: INews[];
  lic_justificadas: INews[];
  lic_no_justificadas: INews[];
  embargos: INews[];
  feriados: INews[];
  adelantos: INews[];
  vacaciones: INews[];
  licSinSueldo: INews[];
}