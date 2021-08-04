import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { CalculatedHours, IEmployeeLiq, ILicReason } from './liquidation.interface';


export default interface IEmployeeLiquidated extends Document {
  liquidation_id: ObjectId;
  dateFrom: string;
  dateTo: string;
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
  lic_justificada_group_by_reason: ILicReason[];
  liquidated_news_id: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
