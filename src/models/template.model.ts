import { Schema, model, PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import ITemplate from '../interfaces/template.interface';

// Schema
export const templateSchema = new Schema({
  name: {
    type: String
  },
  schedule: [{
    day: { 
      type: String
    },
    firstTime: { 
      type: String
    },
    secondTime: { 
      type: String
    }
  }]
},{
  timestamps: true
});

templateSchema.plugin(mongoosePaginate);


// Model
const Template: PaginateModel<ITemplate> = model('Template', templateSchema);

export default Template;
