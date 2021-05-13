import { Schema, model, PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import ITemplate from '../interfaces/template.interface';



const iScheduleTimeSchema = new Schema({
  hour: {
    type: Number
  },
  minute: {
    type: Number
  }
},{
  _id: false
})

const iScheduleIntervalSchema = new Schema({
  from: iScheduleTimeSchema,
  to: iScheduleTimeSchema
}, {
  _id: false
})

const iScheduleTemplateSchema = new Schema({
  day: {
    type: String
  },
  firstTime: iScheduleIntervalSchema,
  secondTime: iScheduleIntervalSchema
}, {
  _id: false
})

// Schema
export const templateSchema = new Schema({
  name: {
    type: String
  },
  schedule: [iScheduleTemplateSchema]
},{
  timestamps: true
});

templateSchema.plugin(mongoosePaginate);


// Model
const Template: PaginateModel<ITemplate> = model('Template', templateSchema);

export default Template;
