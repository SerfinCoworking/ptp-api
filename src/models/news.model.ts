import { Schema, model, PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import INews, { INewsConcept } from '../interfaces/news.interface';
import Employee, { employeeSchema } from '../models/employee.model';
import { ObjectId } from 'mongodb';
import IEmployee from '../interfaces/employee.interface';


// Validation callbacks

// Si el empleado ya fue dado de baja no permitir modificar / crear
const employeeIsBaja = async function(employee: IEmployee): Promise<boolean>{
  const employeeTarget: IEmployee | null = await Employee.findOne({_id: employee._id, status: "BAJA"});
  return !employeeTarget
}


const feriadoUniqueByDay = async function(conceptKey: string): Promise<boolean> {
  const _id = typeof(this._id) !== 'undefined' ? this._id : this.getFilter()._id;
  if(conceptKey === 'FERIADO'){
    const news = await News.findOne({ 
      'concept.key': conceptKey, 
      $or: [
        {
          'dateFrom': { $eq: this.dateFrom},
        },
        {
          'dateTo': { $eq: this.dateTo }
        },
        { 
          'dateFrom': { $lte: this.dateFrom},
          'dateTo': { $gte: this.dateFrom }
        },
        { 
          'dateFrom': { $lte: this.dateTo},
          'dateTo': { $gte: this.dateTo }
        },
        { 
          'dateFrom': { $gte: this.dateFrom},
          'dateTo': { $lte: this.dateTo }
        }
      ],
      _id: { $nin: [_id] } 
    });
    return !news;
  }
  return true;
};
const conceptUniqueByEmployee = async function(conceptKey: string): Promise<boolean> {
  const _id = typeof(this._id) !== 'undefined' ? this._id : this.getFilter()._id;
  const obj = typeof(this._id) !== 'undefined' ? this : this.getUpdate().$set;
  if(conceptKey !== 'FERIADO' && conceptKey !== 'CAPACITACIONES'){
    const news = await News.findOne({ 
      'concept.key': conceptKey, 
      $or: [
        {
          'dateFrom': { $eq: obj.dateFrom},
        },
        {
          'dateTo': { $eq: obj.dateTo }
        },
        { 
          'dateFrom': { $lte: obj.dateFrom},
          'dateTo': { $gte: obj.dateFrom }
        },
        { 
          'dateFrom': { $lte: obj.dateTo},
          'dateTo': { $gte: obj.dateTo }
        },
        { 
          'dateFrom': { $gte: obj.dateFrom},
          'dateTo': { $lte: obj.dateTo }
        }
      ],
      'employee._id': obj.employee._id,
      _id: { $nin: [_id] } 
    });
    return !news;
  }
  return true;
};
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
    name: {
      type: String
    },
    key: {
      type: String
    }
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
  assigned_hours: {
    type: Number,
    default: 0
  },    
  observation:{
    type: String    
  }, 
  docLink:{
    type: String    
  }, 
  telegramDate:{
    type: String    
  }
},{
  timestamps: true
});

newsSchema.plugin(mongoosePaginate);


// Model
const News: PaginateModel<INews> = model('News', newsSchema);

News.schema.path('employee').validate(employeeIsBaja, 'El usuario ya fue dado de baja.');
News.schema.path('concept.key').validate(feriadoUniqueByDay, 'El concepto {VALUE} ya existe en las fechas ingresadas.');
News.schema.path('concept.key').validate(conceptUniqueByEmployee, 'El empleado ya tiene un concepto {VALUE} cargado en las fechas ingresadas.', 'employee');
export default News;
