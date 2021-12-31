import { Schema, model, PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import { ISchedule } from '../interfaces/schedule.interface';
import { ObjectId } from 'mongodb';

// Schema
export const scheduleSchema = new Schema({
  objective: {
    name: String
  },
  lastPeriod: { type: ObjectId },
  lastPeriodMonth: { type: String },
  lastPeriodRange: {
    fromDate: { type: String },
    toDate: { type: String }
  }
},{
  timestamps: true
});

scheduleSchema.plugin(mongoosePaginate);

// Model
const schedule: PaginateModel<ISchedule> = model('Schedule', scheduleSchema);

export default schedule;
