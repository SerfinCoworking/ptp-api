import { Schema, model, PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import INews, { _ljReasons } from '../interfaces/news.interface';
import Employee, { employeeSchema } from '../models/employee.model';
import { ObjectId } from 'mongodb';
import IEmployee from '../interfaces/employee.interface';
import Period from './period.model';
import { IPeriod } from '../interfaces/schedule.interface';

// Validation callbacks

// Si el empleado ya fue dado de baja no permitir modificar / crear
const employeeIsBaja = async function(employee: IEmployee): Promise<boolean>{
  const _id = typeof(this._id) !== 'undefined' ? this._id : this.getFilter()._id;

  const news: INews | null = await News.findOne({_id: _id}).select('employee._id');
  
  const employeeTarget: IEmployee | null = await Employee.findOne({
    $and: [
      {_id: employee._id}, 
      {status: "BAJA"}
    ] 
  });
  return !employeeTarget || (!!news && !!news.employee?._id.equals(employeeTarget._id) );
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

const requiredEmployees = async function(conceptKey: string) {
  const _id = typeof(this._id) !== 'undefined' ? this._id : this.getFilter()._id;
  const obj = typeof(this._id) !== 'undefined' ? this : this.getUpdate().$set;
  if(conceptKey === 'CAPACITACIONES'){
    if(obj.employeeMultiple && obj.employeeMultiple.length){

      const validEmployees = await Promise.all(
        obj.employeeMultiple.map(async (employee: IEmployee) => {
          const news: INews | null = await hasNews(obj.dateFrom, obj.dateTo, employee._id, _id);
          return {valid: !news, employeeId: employee._id}
        })
      );
      if(validEmployees.filter((epl: any) => !epl.valid).length){
        throw new Error("CAPACITACIONES_Uno o varios empleados seleccionado poseen una novedad cargada en las fechas ingresadas_" + JSON.stringify(validEmployees));
      }
      return true;
    }else{
      return false;
    }
  }

  return true;
}

const requiredHours = async function(conceptKey: string) {
  const obj = typeof(this._id) !== 'undefined' ? this : this.getUpdate().$set;
  if(conceptKey === 'CAPACITACIONES'){
    return obj.capacitationHours && typeof obj.capacitationHours === 'number';
  }
  return true;
}

const requiredReason = async function(conceptKey: string) {
  const obj = typeof(this._id) !== 'undefined' ? this : this.getUpdate().$set;
  if(['LIC_JUSTIFICADA'].includes(conceptKey)){
    
    if(obj.reason){
      const reasonTarget = _ljReasons.find((reason: any) => reason.key == obj.reason.key);
      return !!reasonTarget
    }else{
      return false;
    }
  }
  return true
}

const requiredImport = async function(conceptKey: string) {
  const obj = typeof(this._id) !== 'undefined' ? this : this.getUpdate().$set;
  if(['ADELANTO', 'PLUS_RESPONSABILIDAD'].includes(conceptKey)){
    
    if(obj.import && typeof obj.import === 'number'){
      return obj.import > 0;
    }else{
      return false;
    }
  }
  return true
}

const conceptUniqueByEmployee = async function(employee: string): Promise<boolean> {
  const _id = typeof(this._id) !== 'undefined' ? this._id : this.getFilter()._id;
  const obj = typeof(this._id) !== 'undefined' ? this : this.getUpdate().$set;
  if(!['ALTA', 'ACTIVO', 'BAJA', 'FERIADO', 'ADELANTO', 'CAPACITACIONES', 'EMBARGO', 'PLUS_RESPONSABILIDAD'].includes(obj.concept.key)){
    const news: INews | null = await hasNews(obj.dateFrom, obj.dateTo, obj.employee._id, _id);
    return !news;
  }
  return true;
};

const noSchedules = async function(conceptKey: string): Promise<boolean> {
  const obj = typeof(this._id) !== 'undefined' ? this : this.getUpdate().$set;
  if (conceptKey === 'LIC_JUSTIFICADA' && obj.employee){
    const period: IPeriod | null = await Period.findOne(
    {
      $and: [{
        $or: [
        {
          $and: [
            { fromDate: { $lte: obj.dateFrom } },
            { toDate: {$gte: obj.dateFrom } }
          ]
        }, {
          $and: [
            { fromDate: { $lte: obj.dateTo } },
            { toDate: {$gte: obj.dateTo } }
          ]
        },{
          $and: [
            { fromDate: { $gte: obj.dateFrom } },
            { toDate: {$lte: obj.dateTo } }
          ]
        }],
        shifts: {
          $elemMatch: {
            $and: [
              { 'employee._id': { $eq: obj.employee._id } },
              { 
                events: {
                  $elemMatch: {
                    $or: [
                      {
                        $and: [
                          { fromDatetime: { $lte: obj.dateFrom } },
                          { toDatetime: {$gte: obj.dateFrom } }
                        ]
                      }, {
                        $and: [
                          { fromDatetime: { $lte: obj.dateTo } },
                          { toDatetime: {$gte: obj.dateTo } }
                        ]
                      },{
                        $and: [
                          { fromDatetime: { $gte: obj.dateFrom } },
                          { toDatetime: {$lte: obj.dateTo } }
                        ]
                      }]
                  }
                }
              }
            ]              
          }
        }
      }]
    });
    // console.log(period);
    return !period;  
  }
  return true;
}

const hasNews = async function(dateFrom: string , dateTo: string, employee_id: ObjectId, _id: string): Promise<INews | null> {
  return await News.findOne({ 
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
        'dateFrom': { $lt: dateFrom},
        'dateTo': { $gt: dateTo }
      },
      { 
        'dateFrom': { $eq: dateFrom}
      },
      {
        'dateTo': { $eq: dateFrom }
      },
      { 
        'dateFrom': { $eq: dateTo}
      },
      {
        'dateTo': { $eq: dateTo }
      },
      {
        $and: [
          { 
            'dateFrom': { $gt: dateFrom},
          },{
            'dateFrom': { $lt: dateTo }
          },
        ]
      },
      { 
        $and: [
          { 
            'dateTo': { $gt: dateFrom},
          },{
            'dateTo': { $lt: dateTo }
          },
        ]
      }
    ],
    'employee._id': employee_id,
    _id: { $nin: [_id] } 
  });
}

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
News.schema.path('concept.key').validate(requiredReason, 'LICJUSTIFICADA_Debe seleccionar una razón valida.');
News.schema.path('concept.key').validate(requiredImport, 'ADELANTO_Debe seleccionar un importe valido.');
News.schema.path('concept.key').validate(requiredImport, 'PLUSRESPONSABILIDAD_Debe seleccionar un importe valido.');
News.schema.path('concept.key').validate(requiredEmployees, 'CAPACITACIONES_Debe seleccionar almenos un empleado.');
News.schema.path('concept.key').validate(requiredHours, 'CAPACITACIONESHS_Debe seleccionar una cantidad de horas.');
News.schema.path('concept.key').validate(noSchedules, 'LICJUSWITHSCH_El empleado tiene guardias asignadas en el rango de fechas ingresado.');
News.schema.path('dateFrom').validate(requireDateFrom, 'DATEFROM_Debe seleccionar una fecha.');
News.schema.path('employee').validate(conceptUniqueByEmployee, 'EMPLOYEE_El empleado posee una Novedad cargada en las fechas ingresadas.');
export default News;
