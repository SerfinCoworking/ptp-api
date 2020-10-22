import { Schema } from 'mongoose';
import { IProfile } from '../interfaces/embedded.documents.inteface';


export const profileSchema: Schema<IProfile> = new Schema({
  firstName: {
    type: String,
    required: '{PATH} is required'
  },
  lastName: {
    type: String,
    required: '{PATH} is required'
  },
  avatar: {
    type: String
  },
  dni: {
    type: String,
    required: '{PATH} is required'
  },
  admissionDate: {
    type: String,
    required: '{PATH} is required'
  },
  employer: {
    type: String,
    required: '{PATH} is required'
  }
}, { _id : false });

export const addressSchema = new Schema({
  street: {
    type: String
  },
  city: {
    type: String
  },
  zip: {
    type: String
  },
  streetNumber: {
    type: String
  },
  department: {
    type: String
  },
  manz: {
    type: String
  },
  lote: {
    type: String
  },
  neighborhood: {
    type: String
  },
  province: {
    type: String
  }
}, { _id : false });

export const phoneSchema = new Schema({
  area: {
    type: String,
    required: '{PATH} is required'
  },
  line: {
    type: String,
    required: '{PATH} is required'
  }
}, { _id : false });

export const contactSchema = new Schema({
  email: {
    type: String,
    required: '{PATH} is required'
  },
  address: addressSchema,
  phones: [ phoneSchema ],
}, { _id : false });

export const serviceTypeSchema = new Schema({
  name: {
    type: String,
    required: '{PATH} is required'
  },
  hours: {
    type: Number,
    required: '{PATH} is required'
  }
}, { _id : false });
