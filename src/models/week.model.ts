import { Schema, Model, model } from 'mongoose';
import IWeek from '../interfaces/week.interface';

// Schema
export const weekSchema = new Schema({
  fromDay: {
    type: Number,
    required: '{PATH} is required'
  },
  toDay: {
    type: Number,
    required: '{PATH} is required'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
});

// Model
const Week: Model<IWeek> = model<IWeek>('Week', weekSchema);

export default Week;