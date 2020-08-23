import { Schema, Model, model } from 'mongoose';
import IShift from '../interfaces/shift.interface';

// Schema
export const shiftSchema = new Schema({
  fromDate: {
    type: Date,
    required: '{PATH} is required'
  },
  toDate: {
    type: Date,
    required: '{PATH} is required'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
});

// Model
const Shift: Model<IShift> = model<IShift>('Shift', shiftSchema);

export default Shift;