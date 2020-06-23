import { Document } from 'mongoose';

export interface IProfile extends Document {
  firstName: string;
  lastName: string;
  avatar: string;
  dni: string;
}

export interface IAddress extends Document {
  street: string;
  city: string;
  zip: string;
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
