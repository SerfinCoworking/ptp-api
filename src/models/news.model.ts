import { Schema, model, PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import INews from '../interfaces/news.interface';
import Employee, { employeeSchema } from '../models/employee.model';
import { ObjectId } from 'mongodb';
import IEmployee from '../interfaces/employee.interface';


// Validation callbacks

// Si el empleado ya fue dado de baja no permitir modificar / crear
const employeeIsBaja = async function(employee: IEmployee): Promise<boolean>{
  const employeeTarget: IEmployee | null = await Employee.findOne({
    _id: employee._id, 
    status: "BAJA"
  });
  return !employeeTarget
}


const feriadoUniqueByDay = async function(conceptKey: string): Promise<boolean> {
  const _id = typeof(this._id) !== 'undefined' ? this._id : this.getFilter()._id;
  if(conceptKey === 'FERIADO'){
    const news = await News.findOne({ 
      'concept.key': 'FERIADO', 
      $or: [
        {
          'dateFrom': { $lt: this.dateFrom},
          'dateTo': { $gt: this.dateTo }
        },
        { 
          'dateFrom': { $eq: this.dateFrom}
        },
        {
          'dateTo': { $eq: this.dateFrom }
        },
        { 
          'dateFrom': { $eq: this.dateTo}
        },
        {
          'dateTo': { $eq: this.dateTo }
        },
        {
          $and: [
            { 
              'dateFrom': { $gt: this.dateFrom},
            },{
              'dateFrom': { $lt: this.dateTo }
            },
          ]
        },
        { 
          $and: [
            { 
              'dateTo': { $gt: this.dateFrom},
            },{
              'dateTo': { $lt: this.dateTo }
            },
          ]
        }
      ],
      _id: { $nin: [_id] } 
    });
    return !news;
  }
  return true;
};

const requireDateFrom = async function(dateFrom: string) {
  return !!dateFrom
}

const requiredEmployee = async function(conceptKey: string) {
  const obj = typeof(this._id) !== 'undefined' ? this : this.getUpdate().$set;
  if(['FERIADO', 'CAPACITACIONES'].includes(conceptKey)){
    return true;
  }else{
    if(obj.employee){
      const employee = await Employee.findOne({_id: obj.employee._id});
      return !!employee
    }else{
      return false;
    }
  }
}

const conceptUniqueByEmployee = async function(employee: string): Promise<boolean> {
  const _id = typeof(this._id) !== 'undefined' ? this._id : this.getFilter()._id;
  const obj = typeof(this._id) !== 'undefined' ? this : this.getUpdate().$set;
  if(!['ALTA', 'ACTIVO', 'BAJA', 'FERIADO', 'ADELANTO', 'CAPACITACIONES', 'EMBARGO', 'PLUS_RESPONSABILIDAD'].includes(obj.concept.key)){
    const news = await News.findOne({ 
      'concept.key': {$nin: [
        'ALTA',
        'ACTIVO',
        'BAJA',
        'FERIADO',
        'ADELANTO',
        'CAPACITACIONES',
        'EMBARGO',
        'PLUS_RESPONSABILIDAD'
      ]},
      $or: [
        {
          'dateFrom': { $lt: this.dateFrom},
          'dateTo': { $gt: this.dateTo }
        },
        { 
          'dateFrom': { $eq: this.dateFrom}
        },
        {
          'dateTo': { $eq: this.dateFrom }
        },
        { 
          'dateFrom': { $eq: this.dateTo}
        },
        {
          'dateTo': { $eq: this.dateTo }
        },
        {
          $and: [
            { 
              'dateFrom': { $gt: this.dateFrom},
            },{
              'dateFrom': { $lt: this.dateTo }
            },
          ]
        },
        { 
          $and: [
            { 
              'dateTo': { $gt: this.dateFrom},
            },{
              'dateTo': { $lt: this.dateTo }
            },
          ]
        }
      ],
      'employee._id': obj.employee._id,
      _id: { $nin: [_id] } 
    });
    console.log(news);
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

News.schema.path('employee').validate(employeeIsBaja, 'EMPLOYEE_El usuario ya fue dado de baja.');
News.schema.path('concept.key').validate(requiredEmployee, 'EMPLOYEE_Debe seleccionar un empleado valido.');
News.schema.path('concept.key').validate(feriadoUniqueByDay, 'CONCEPT_Ya existe un feriado en las fechas ingresadas.');
News.schema.path('dateFrom').validate(requireDateFrom, 'DATEFROM_Debe seleccionar una fecha.');
News.schema.path('employee').validate(conceptUniqueByEmployee, 'EMPLOYEE_El empleado posee una Novedad cargada en las fechas ingresadas.');
export default News;
