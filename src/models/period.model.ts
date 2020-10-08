import { Schema, model, PaginateModel} from 'mongoose';
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
  },
  checkin: {
    type: Date
  },
  checkout: {
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
  events: [ eventSchema ],
  signed: [{
    type: Date
  }],
  otherEvents: [ eventSchema ]
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
    const periods: IPeriod[] | null = await Period.find(
      {
        $and: [
          {$or: [
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
            },{
              $and: [
                { fromDate: { $gte: period.fromDate}},
                { toDate: {$lte: period.toDate}},
                {"objective._id": new ObjectId(period.objective._id) }
              ]
            }
          ]},
          { _id: { $nin: [period._id]} }
        ]
      }
    );

    return !!periods.length;
  } catch(err){
    throw new Error(err);
  }
});

export default Period;
