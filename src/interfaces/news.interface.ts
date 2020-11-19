import { Document } from 'mongoose';
import { ObjectId, ObjectID } from 'mongodb';
import IEmployee from './employee.interface';


export interface INewsConcept extends Document {
  _id: ObjectID;
  name: string;
  key: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default interface INews extends Document {
  _id: ObjectID;
  dateFrom: Date; // fecha incio novedad
  dateTo: Date; // fecha fin novedad: puede ser la misma que la de inicio (1 dia)
  target?: IEmployee; // 1 empleado o todos
  concept: {
    _id: ObjectId;
    name: string;
    key: string;
  };
  reason?: string; // justificacion falta
  acceptEventAsign: boolean; // permite editar eventos de la grilla
  acceptEmployeeUpdate: boolean; // actualiza el estado del empleado BAJA | ALTA
  import?: number; // importe en pesos opcional
  observation?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

