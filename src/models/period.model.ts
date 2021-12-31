import { Schema, model, PaginateModel} from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import { IPeriod } from '../interfaces/schedule.interface';
import { ObjectId } from 'mongodb';


const fromDateRequired = async function(fromDate: string): Promise<boolean>{
  return !!fromDate;
}
const toDateRequired = async function(toDate: string): Promise<boolean>{
  return !!toDate;
}
// La fecha DESDE debe ser unica
const fromDateUnique = async function(fromDate: string): Promise<boolean>{
  const _id = typeof(this._id) !== 'undefined' ? this._id : this.getFilter()._id;
  const obj = typeof(this._id) !== 'undefined' ? this : this.getUpdate().$set;

  const period: IPeriod | null = await Period.findOne({
    'objective._id': obj.objective._id,
    $and: [
      {
        fromDate: { $lte: fromDate },
        toDate: { $gte: fromDate }
      }
    ],
    _id: { $nin: [_id] }
  });
  
  return !period;
}
// La fecha HAST debe ser unica
const toDateUnique = async function(toDate: string): Promise<boolean>{
  const _id = typeof(this._id) !== 'undefined' ? this._id : this.getFilter()._id;
  const obj = typeof(this._id) !== 'undefined' ? this : this.getUpdate().$set;
  const period: IPeriod | null = await Period.findOne({
    'objective._id': obj.objective._id,
    $and: [
      {
        fromDate: { $lte: toDate },
        toDate: { $gte: toDate }
      }
    ],
    _id: { $nin: [_id] }
  });
  
  return !period;
}

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
  checkinDescription:{
    type: String
  },
  checkout: {
    type: Date
  },
  checkoutDescription:{
    type: String
  },
  corrected: {
    type: Boolean
  },
  color: { 
    r: { type: Number},
    g: { type: Number},
    b: { type: Number},
    a: { type: Number},
    hex: { type: String},
    rgba: { type: String}
  },
  name: { type: String }
},{ _id : true });

// Schema Shift
export const shiftSchema = new Schema({
  employee: {
    firstName: {
      type: String
    },
    lastName: {
      type: String
    },
    avatar: {
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
    name: { type: String}
  }
},{
  timestamps: true
});

periodSchema.plugin(mongoosePaginate);

// Model Period
const Period: PaginateModel<IPeriod> = model('Period', periodSchema);

Period.schema.path('fromDate').validate(fromDateRequired, 'FROMDATE_Fecha Desde es requerida.');
Period.schema.path('toDate').validate(toDateRequired, 'TODATE_Fecha Hasta es requerida.');
Period.schema.path('fromDate').validate(fromDateUnique, 'FROMDATE_La fecha ingresada se encuentra en otro período.');
Period.schema.path('toDate').validate(toDateUnique, 'TODATE_La fecha ingresada se encuentra en otro período.');


// Model methods: DEPRECATED
Period.schema.method('validatePeriod', async function(period: IPeriod): Promise<boolean>{  
  
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
});

export default Period;
