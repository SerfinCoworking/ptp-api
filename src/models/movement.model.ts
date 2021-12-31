import { Schema, model, PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';

import { userMovementSchema } from './embedded.documents';
import IMovement from '../interfaces/movement.interface';

// Schema
export const movementSchema = new Schema({
  user: userMovementSchema,
  action: {
    type: String
  },
  resource: {
    type: String
  },
  target: {
    type: String
  }
},{
  timestamps: true
});

movementSchema.plugin(mongoosePaginate);

// Model
const Movement: PaginateModel<IMovement> = model<IMovement>('Movement', movementSchema);

export default Movement;
