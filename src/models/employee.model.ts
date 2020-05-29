import { Schema, Model, model } from 'mongoose';
import {profileSchema, contactSchema} from './embedded.documents';
import IEmployee from '../interfaces/employee.interface';

// Schema
export const employeeSchema = new Schema({
  enrollment: {
    type: String
  },
  profile: profileSchema,
  contact: contactSchema
},{
  timestamps: true
});

// Model
const Employee: Model<IEmployee> = model<IEmployee>('Employee', employeeSchema);

export default Employee;
