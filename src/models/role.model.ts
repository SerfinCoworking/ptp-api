import { Schema, Model, model } from 'mongoose';
import IRole from '../interfaces/role.interface';

// Schema
export const roleSchema = new Schema({
  name: {
    type: String,
    required: '{PATH} is required'
  },
  grants: [{
    _id: false,
    resource: {
      type: String,
      required: '{PATH} is required'
    },
    action: {
      type: String,
      default: '*'
    },
    attributes: {
      type: Array,
      default: ["*"]
    }
  }],
},{
  timestamps: true
});

// Model
const Role: Model<IRole> = model<IRole>('Role', roleSchema);

export default Role;
