import { Schema, model, PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';

import { serviceTypeSchema, addressSchema } from './embedded.documents';
import IObjective from '../interfaces/objective.interface';

// Schema
export const objectiveSchema = new Schema({
  name: {
    type: String
  },
  address: addressSchema,
  serviceType: [serviceTypeSchema],
  description: {
    type: String
  }
},{
  timestamps: true
});

objectiveSchema.plugin(mongoosePaginate);


// Model
const objective: PaginateModel<IObjective> = model('Objective', objectiveSchema);

export default objective;
