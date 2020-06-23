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
  }
}, { _id : false });

export const addressSchema = new Schema({
  street: {
    type: String,
    required: '{PATH} is required'
  },
  city: {
    type: String,
    required: '{PATH} is required'
  },
  zip: {
    type: String,
    required: '{PATH} is required'
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
