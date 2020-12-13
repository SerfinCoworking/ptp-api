import { Document } from 'mongoose';
import { ObjectID } from 'mongodb';

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

export default interface IHoursByWeek extends Document {
  from: moment.Moment;
  to: moment.Moment;
  totalHours: number;
  totalExtraHours: number;
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
  total_hours_work_by_week: IHoursByWeek[];
  total_viaticos: number;
  total_art_in_hours: number;
  total_capacitation_hours: number;
  total_lic_sin_sueldo_days: number;
  createdAt?: Date;
  updatedAt?: Date;
}

