import { Schema, model, PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import INews from '../interfaces/news.interface';
import { employeeSchema } from '../models/employee.model';
import { ObjectId } from 'mongodb';

// Schema
export const newsSchema = new Schema({
  dateFrom: {
    type: String
  },
  dateTo: {
    type: String
  },
  employee: employeeSchema,
  employeeMultiple: [employeeSchema],
  concept: {
    _id: ObjectId,
    name: {
      type: String
    },
    key: {
      type: String
    }
  },
  reason: {
    type: String
  },
  acceptEventAssign:{
    type: Boolean,
    default: false
  },
  acceptEmployeeUpdate:{
    type: Boolean,
    default: false
  },
  import: {
    type: Number
  },    
  capacitationHours: {
    type: Number
  },    
  worked_hours: {
    type: Number,
    default: 0
  },    
  observation:{
    type: String    
  }
},{
  timestamps: true
});

newsSchema.plugin(mongoosePaginate);


// Model
const News: PaginateModel<INews> = model('News', newsSchema);

export default News;
