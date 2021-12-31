import { Schema, model, Model } from 'mongoose';
import { INewsConcept } from '../interfaces/news.interface';

// Schema
export const newsConceptSchema = new Schema({
  name: {
    type: String,
    required: '{PATH} is required'
  },
  key: {
    type: String,
    required: '{PATH} is required'
  }
},{
  timestamps: true
});

// Model
const NewsConcept: Model<INewsConcept> = model<INewsConcept>('NewsConcept', newsConceptSchema);

export default NewsConcept;
