import { Schema, model, PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import ILiquidation from '../interfaces/liquidation.interface';
import { newsSchema } from '../models/news.model';
import { employeeLiqSchema, hoursByWeekSchema, licReasonSchema } from './embedded.documents';

// Schema
export const liquidationSchema = new Schema({
  dateFrom: {
    type: String
  },
  dateTo: {
    type: String
  },
  employee_liquidation: [{
    employee: employeeLiqSchema,
    total_day_in_hours: {type: Number},
    total_night_in_hours: {type: Number},
    total_in_hours: {type: Number},
    total_extra_in_hours: {type: Number},
    total_feriado_in_hours: {type: Number},
    total_suspension_in_hours: {type: Number},
    total_lic_justificada_in_hours: {type: Number},
    total_lic_jus_by_working_day: [{type: String}],
    total_lic_no_justificada_in_hours: { type: Number },
    total_vaciones_in_days: { type: Number },
    total_adelanto_import: { type: Number },
    total_plus_responsabilidad: { type: Number },
    total_hours_work_by_week: [hoursByWeekSchema],
    total_viaticos: { type: Number },
    total_art_in_hours: { type: Number },
    total_art_by_working_day: [{ type: String }],
    total_capacitation_hours: { type: Number },
    total_lic_sin_sueldo_days: { type: Number },
    capacitaciones: [newsSchema],
    plus_responsabilidad: [newsSchema],
    suspensiones: [newsSchema],
    lic_justificadas: [newsSchema],
    lic_justificada_group_by_reason: [licReasonSchema],
    lic_no_justificadas: [newsSchema],
    arts: [newsSchema],
    presentismo: { type: Number },
    embargos: [newsSchema]
  }]
},{
  timestamps: true
});

liquidationSchema.plugin(mongoosePaginate);


// Model
const Liquidation: PaginateModel<ILiquidation> = model('liquidation', liquidationSchema);

export default Liquidation;
