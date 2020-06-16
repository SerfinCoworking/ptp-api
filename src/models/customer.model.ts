import { Schema, PaginateModel, model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

import {profileSchema, contactSchema} from './embedded.documents';
import ICustomer from '../interfaces/customer.interface';

// Schema
export const customerSchema = new Schema({
  cuit: {
    type: String
  },
  profile: profileSchema,
  contact: contactSchema
},{
  timestamps: true
});

customerSchema.plugin(mongoosePaginate);


// Model
const Customer: PaginateModel<ICustomer> = model('Customer', customerSchema);
// const Customer: Model<ICustomer> = model<ICustomer>('Customer', customerSchema);

export default Customer;
