import { Schema, model, PaginateModel} from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import { IPeriod } from '../interfaces/schedule.interface';
import { ObjectId } from 'mongodb';



// Schema Event
export const eventSchema = new Schema({
  fromDatetime: {
    type: Date,
    unique: true
  },
  toDatetime: {
    type: Date,
    unique: true
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
    _id: { type: ObjectId},
    name: { type: String}
  }
},{
  timestamps: true
});

periodSchema.plugin(mongoosePaginate);

// Model Period
const Period: PaginateModel<IPeriod> = model('Period', periodSchema);


// Model methods
Period.schema.method('validatePeriod', async function(period: IPeriod): Promise<boolean>{
  try{
    console.log("in period model", period);
    const periods: IPeriod[] | null = await Period.find(
      {
        $or: [
          {
            $and: [
              { fromDate: { $lte: period.fromDate}},
              { toDate: {$gte: period.fromDate}},
              {"objective._id": new ObjectId(period.objective._id) }
            ]
          },{
            $and: [
              { fromDate: { $lte: period.toDate}},
              { toDate: {$gte: period.toDate}},
              {"objective._id": new ObjectId(period.objective._id) }
            ]
          }
        ]
      }
    );
    return !!periods.length;
  } catch(err){
    throw new Error(err);
  }
});

export default Period;
