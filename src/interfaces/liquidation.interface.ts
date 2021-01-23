import { Document } from 'mongoose';
import { ObjectID } from 'mongodb';
import INews from './news.interface';
import { IEvent } from './schedule.interface';
import IObjective from './objective.interface';

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
  from: moment.Moment;
  to: moment.Moment;
  totalHours: number;
  totalExtraHours: number;
  events?: IEventWithObjective[];
}
export default interface ILiquidation extends Document {
  employee: IEmployeeLiq;
  total_day_in_hours: number;
  total_night_in_hours: number;
  total_in_hours: number;
  total_extra_in_hours: number;
  total_feriado_in_hours: number;
  total_suspension_in_hours: number;
  total_lic_justificada_in_hours: number;
  total_lic_no_justificada_in_hours: number;
  total_vaciones_in_days: number;
  total_adelanto_import: number;
  total_plus_responsabilidad: number;
  total_hours_work_by_week: IHoursByWeek[];
  total_viaticos: number;
  total_art_in_hours: number;
  total_capacitation_hours: number;
  total_lic_sin_sueldo_days: number;
  capacitaciones: INews[];
  plus_responsabilidad: INews[];
  suspensiones: INews[];
  lic_justificadas: INews[];
  lic_justificada_group_by_reason: any,
  lic_no_justificadas: INews[];
  arts: INews[];
  presentismo: number;
  embargos: INews[];
  createdAt?: Date;
  updatedAt?: Date;
}

