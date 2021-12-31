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
  reason?: {
    name: string;
    key: string;
  }; // justificacion falta
  acceptEventAsign: boolean; // permite editar eventos de la grilla
  acceptEmployeeUpdate: boolean; // actualiza el estado del empleado BAJA | ALTA
  import?: number; // importe en pesos opcional
  capacitationHours?: number; // horas de capacitacion
  observation?: string;
  docLink?: string;
  telegramDate?: string;
  worked_hours?: number; // horas trabajadas
  assigned_hours?: number; // horas que debieron ser trabajadas
  createdAt?: Date;
  updatedAt?: Date;
}

export const _ljReasons: any = [
  {
    key: "FALLEC_ESPOSA_HIJOS_PADRES",
    name: "Fallecimiento de esposa, hijos o padres",
  },
  {
    key: "FALLEC_SUEGROS_HERMANOS",
    name: "Fallecimiento de suegros o hermanos",
  },
  {
    key: "NAC_HIJO_ADOPCION",
    name: "Nacimiento de hijo o adopción",
  },
  {
    key: "FALLEC_YERNO_NUERA",
    name: "Fallecimiento de yerno o nuera",
  },
  {
    key: "MATRIMONIO",
    name: "Matrimonio",
  },
  {
    key: "EXAMEN",
    name: "Exámenes",
  },
  {
    key: "EMFERMEDAD",
    name: "Emfermedad"
  }   
]
