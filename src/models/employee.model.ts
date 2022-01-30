import { Schema, model, PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';

import {profileSchema, contactSchema} from './embedded.documents';
import IEmployee from '../interfaces/employee.interface';


const uniqueRfid = async function(rfid: number): Promise<boolean> {
  // excluimos el id del usuario que vamos a actualizar para no validar que se esta repitiendo el campo username
  const _id = typeof(this._id) !== 'undefined' ? this._id : this.getFilter()._id;
  const employee = await Employee.findOne({ rfid, _id: { $nin: [_id] } });
  return !employee;
};


// Schema
export const employeeSchema = new Schema({
  enrollment: {
    type: String
  },
  rfid: {
    type: Number
  },
  status: {
    type: String
  },
  profile: profileSchema,
  contact: contactSchema
},{
  timestamps: true
});

employeeSchema.plugin(mongoosePaginate);


// Model
const Employee: PaginateModel<IEmployee> = model('Employee', employeeSchema);
Employee.schema.path('rfid').validate(uniqueRfid, 'Esta tarjeta ya está en uso');
// const Employee: Model<IEmployee> = model<IEmployee>('Employee', employeeSchema);

export default Employee;
