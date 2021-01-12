import { Document } from 'mongoose';

export interface IProfile extends Document {
  firstName: string;
  lastName: string;
  avatar: string;
  dni: string;
  cuilPrefix: string;
  cuilDni: string;
  cuilSufix: string;
  admissionDate: string;
  employer: string;
  function: string;
  art: string;
  birthdate: string;
  nationality: string;
  maritalStatus: string;
  sonsCount: number;
  studyLevel: string;
  observations: string;
}

export interface IAddress extends Document {
  street?: string;
  city?: string;
  zip?: string;
  streetNumber?: string;
  department?: string;
  manz?: string;
  lote?: string;
  neighborhood?: string;
  province?: string;
}

export interface IPhone extends Document {
  area: string;
  line: string;
}

export interface IContact extends Document {
  email: string;
  address: IAddress;
  phones: IPhone[];

}
export interface IServiceType {
  name: string;
  hours: number;
}

export interface IDefaultSchedule {
  fromTime:{
    hour: number;
    minute: number;    
  },
  toTime:{
    hour: number;
    minute: number;    
  }
}