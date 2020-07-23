import { Schema, model, PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import { IPeriod } from '../interfaces/schedule.interface';
import { ObjectId } from 'mongodb';


// Schema Event
export const eventSchema = new Schema({
  fromDatetime: {
    type: Date
  },
  toDatetime: {
    type: Date
  }
},{ _id : false });

// Schema Shift
export const shiftSchema = new Schema({
  employee: {
    _id: ObjectId,
    firstName: {
      type: String
    },
    lastName: {
      type: String
    }
  },
  events: [ eventSchema ]
},{
  _id: false
});

// Schema Period
export const periodSchema = new Schema({
  fromDate: {
    type: String
  },
  toDate: {
    type: String
  },
  shifts: [shiftSchema],
  objective: {
    _id: ObjectId,
    name: String
  }
},{
  timestamps: true
});

periodSchema.plugin(mongoosePaginate);

// Model Period
const Period: PaginateModel<IPeriod> = model('Period', periodSchema);

export default Period;
