import { Schema, model, PaginateModel } from 'mongoose';
import { ObjectId } from 'bson';
import IEmployeeSigned from '../interfaces/employee-signed.interface.';
import mongoosePaginate from 'mongoose-paginate';

const signedByPeriodSchema = new Schema({
  period_id: { type: ObjectId },
  employee_id: { type: ObjectId },
  signed: [{
    type: Date
  }],
  objective: {
    name: { type: String}
  }
}, { _id : false });
// Schema
export const employeeSignedSchema = new Schema({
  employee_liquidated_id: { type: ObjectId },
  signed_by_period: [signedByPeriodSchema]
},{
  timestamps: true
});
employeeSignedSchema.plugin(mongoosePaginate);
// Model
const EmployeeSigned: PaginateModel<IEmployeeSigned> = model('EmployeeSigned', employeeSignedSchema);
export default EmployeeSigned;
