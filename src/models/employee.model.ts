import { Schema, PaginateModel, model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

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

employeeSchema.plugin(mongoosePaginate);


// Model
const Employee: PaginateModel<IEmployee> = model('Employee', employeeSchema);
// const Employee: Model<IEmployee> = model<IEmployee>('Employee', employeeSchema);

export default Employee;
