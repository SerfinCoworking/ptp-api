import { Schema, model, PaginateModel } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';

import { serviceTypeSchema, addressSchema, defaultSchedulesSchema } from './embedded.documents';
import IObjective from '../interfaces/objective.interface';
import bcrypt from 'bcryptjs';
import IUser from '../interfaces/user.interface';
import User from './user.model';


const uniqueIdentifier = async function(identifier: string): Promise<boolean> {
  // excluimos el id del usuario que vamos a actualizar para no validar que se esta repitiendo el campo identifier
  const _id = typeof(this._id) !== 'undefined' ? this._id : this.getFilter()._id;
  let objective: IObjective | IUser | null = await Objective.findOne({ identifier, _id: { $nin: [_id] } });
  // checkeamos que el identificador del objetivo para logear, no se encuentre en uso en algun usuario
  if(!objective) objective = await User.findOne({ username: identifier });

  return !objective;
};

// Setter
const encryptPassword = (password: string) => {
  const salt = bcrypt.genSaltSync(10);
  const passwordDigest = bcrypt.hashSync(password, salt);
  return passwordDigest;
}

const objectiveIdentifier = (identifier: string) => {
  const identifierDigest = identifier.toLowerCase();
  return identifierDigest;
}

// Schema
export const objectiveSchema = new Schema({
  name: {
    type: String,
    required: '{PATH} is required is required',
  },
  identifier: {
    type: String,
    unique: true,
    required: '{PATH} is required is required',
    set: objectiveIdentifier
  },
  address: addressSchema,
  serviceType: [serviceTypeSchema],  
  description: {
    type: String
  },
  avatar: {
    type: String
  },
  status: {
    type: String
  },
  password: {
    type: String,
    set: encryptPassword
  },
  role: {
    _id: false,
    name:{
      type: String,
      default: 'objective'
    },
    permissions:[{
      _id: false,
      name: {
        type: String
      }
    }]
  },
  refreshToken: {
    type: String,
  },
  loginCount:{
    type: Number,
    default: 0
  },
  defaultSchedules: [defaultSchedulesSchema]
},{
  timestamps: true
});

objectiveSchema.plugin(mongoosePaginate);

// Model
const Objective: PaginateModel<IObjective> = model<IObjective>('Objective', objectiveSchema);

// Model methods
Objective.schema.method('isValidPassword', async function(thisObjective: IObjective, password: string): Promise<boolean>{
  try{
    return await bcrypt.compare(password, thisObjective.password);
  } catch(err){
    throw new Error(err);
  }
});

Objective.schema.path('identifier').validate(uniqueIdentifier, 'Este {PATH} ya está en uso');
export default Objective;
