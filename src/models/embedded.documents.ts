import { Schema } from 'mongoose';
import { IProfile } from '../interfaces/embedded.documents.inteface';
import { eventSchema } from './period.model';


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
  },
  color: { 
    r: { type: Number},
    g: { type: Number},
    b: { type: Number},
    a: { type: Number},
    hex: { type: String},
    rgba: { type: String}
  },
  name: { type: String }
}, { _id : false });

export const employeeLiqSchema = new Schema({
  enrollment: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  avatar: { type: String },
  dni: { type: String },
  cuilPrefix: { type: String },
  cuilDni: { type: String },
  cuilSufix: { type: String },
  function: { type: String },
  employer: { type: String },
  art: { type: String },
  status: { type: String }
}, { _id : true });


export const licReasonSchema = new Schema({
  key: { type: String },
  name: { type: String },
  assigned_hours: { type: Number },
}, { _id : false });

export const eventWithObjectiveSchema = new Schema({
  event: eventSchema,
  objectiveName: { type: String },
  diffInHours: { type: Number },
  dayHours: { type: Number },
  nightHours: { type: Number },
  feriadoHours: { type: Number },
}, { _id : false });




export const hoursByWeekSchema = new Schema({
  from: { type: String},
  to: { type: String},
  totalHours: { type: Number },
  totalExtraHours: { type: Number },
  events: [eventWithObjectiveSchema],
}, { _id : false });

export const calculatedHoursSchema = new Schema({
  total: { type: Number },
  by: {
    day: { type: Number }, 
    night: { type: Number },
  },
  extras: { type: Number },
  by_week: [ hoursByWeekSchema ],
}, { _id : false });

export const userMovementSchema = new Schema({
  username: { type: String},
  profile: {
    firstName: {
      type: String
    },
    lastName: {
      type: String
    },
    dni: {
      type: String
    }
  }
});


