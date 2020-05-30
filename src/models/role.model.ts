import { Schema, Model, model, Document } from 'mongoose';
import IRole from '../interfaces/role.interface';

const uniqueRoleName = async function(name: string): Promise<boolean> {
  const _id = (this instanceof Document) ? undefined : this.getFilter()._id; //
  const role = await Role.findOne({ name, _id: { $nin: [_id] } });
  return !role;
};

// Schema
export const roleSchema = new Schema({
  name: {
    type: String,
    unique: true,
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

Role.schema.path('name').validate(uniqueRoleName, 'This {PATH} is already registered');

export default Role;
