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
  cuilPrefix: {
    type: String,
    required: '{PATH} is required'
  },
  cuilDni: {
    type: String,
    required: '{PATH} is required'
  },
  cuilSufix: {
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
  },
  function: {
    type: String,
    required: '{PATH} is required'
  },
  art: {
    type: String,
    required: '{PATH} is required'
  },
  birthdate: {
    type: String,
    required: '{PATH} is required'
  },
  nationality: {
    type: String,
    required: '{PATH} is required'
  },
  maritalStatus: {
    type: String,
    required: '{PATH} is required'
  },
  sonsCount: {
    type: Number,
    required: '{PATH} is required',
    default: 0
  },
  studyLevel: {
    type: String,
    required: '{PATH} is required'
  },
  observations: {
    type: String
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
    type: String
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

export const defaultSchedulesSchema = new Schema({
  fromTime: {
    hour: {
      type: Number,
      required: '{PATH} is required'
    },
    minute: {
      type: Number,
      required: '{PATH} is required'
    },
  },
  toTime: {
    hour: {
      type: Number,
      required: '{PATH} is required'
    },
    minute: {
      type: Number,
      required: '{PATH} is required'
    },
  }
}, { _id : false });


