import { Document } from 'mongoose';

export interface IProfile extends Document {
  firstName: string;
  lastName: string;
  avatar: string;
  dni: string;
  admissionDate: string;
  employer: string;
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
