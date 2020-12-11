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
  dateFrom: string; // fecha incio novedad
  dateTo: string; // fecha fin novedad: puede ser la misma que la de inicio (1 dia)
  employee?: IEmployee; // 1 empleado o todos
  employeeMultiple?: IEmployee[]; // 1 empleado o todos
  concept: {
    _id: ObjectId;
    name: string;
    key: string;
  };
  reason?: string; // justificacion falta
  acceptEventAsign: boolean; // permite editar eventos de la grilla
  acceptEmployeeUpdate: boolean; // actualiza el estado del empleado BAJA | ALTA
  import?: number; // importe en pesos opcional
  capacitationHours?: number; // importe en pesos opcional
  observation?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

