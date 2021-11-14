import { ObjectId } from 'bson';
import { Schema, model, PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import ILiquidation from '../interfaces/liquidation.interface';
import { calculatedHoursSchema, employeeLiqSchema, licReasonSchema } from './embedded.documents';


// Schema
export const liquidationSchema = new Schema({
  name: {
    type: String
  },
  observation: {
    type: String
  },
  dateFrom: {
    type: String
  },
  dateTo: {
    type: String
  },
  status: {
    type: String
  },
  liquidatedEmployees: [{
    employee: employeeLiqSchema,
    total_by_hours: {
      signed: calculatedHoursSchema,
      schedule: calculatedHoursSchema,
      news: {
        feriado: { type: Number },
        suspension: { type: Number },
        lic_justificada: { type: Number },
        lic_no_justificada: { type: Number },
        art: { type: Number },
        capacitaciones: { type: Number },
      },
    },
    hours_by_working_day: {
      lic_justificadas: { type: Number },
      lic_no_justificas: [ { type: String } ],
      suspension: [ { type: String } ],
      art: [ { type: String } ],
    },
    total_of_news: {
      vaciones_by_days: { type: Number },
      adelanto_import: { type: Number },
      plus_responsabilidad: { type: Number },
      lic_sin_sueldo_by_days: { type: Number },
      presentismo: { type: Number },
      embargo: { type: Number },
    },
    total_viaticos: { type: Number },
    lic_justificada_group_by_reason: [licReasonSchema],
    liquidated_news_id: { type: ObjectId }
  }]
},{
  timestamps: true
});

liquidationSchema.plugin(mongoosePaginate);


// Model
const Liquidation: PaginateModel<ILiquidation> = model('liquidation', liquidationSchema);

export default Liquidation;
