import { Schema, model, PaginateModel } from 'mongoose';
import { ILiquidatedNews } from '../interfaces/liquidation.interface';
import { newsSchema } from '../models/news.model';

// Schema
export const liquidatedNewsSchema = new Schema({
  arts: [newsSchema],
  capacitaciones: [newsSchema],
  plus_responsabilidad: [newsSchema],
  suspensiones: [newsSchema],
  lic_justificadas: [newsSchema],
  lic_no_justificadas: [newsSchema],
  embargos: [newsSchema],
  feriados: [newsSchema],
  adelantos: [newsSchema],
  vacaciones: [newsSchema],
  licSinSueldo: [newsSchema]
},{
  timestamps: true
});


// Model
const LiquidatedNews: PaginateModel<ILiquidatedNews> = model('liquidatedNews', liquidatedNewsSchema);

export default LiquidatedNews;
