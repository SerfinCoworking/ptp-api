import { Schema, model, PaginateModel } from 'mongoose';
import bcrypt from 'bcryptjs';
import IUser from '../interfaces/user.interface';
import Role from '../models/role.model';
import IRole from '../interfaces/role.interface';
import mongoosePaginate from 'mongoose-paginate';

// Validation callbacks
const uniqueEmail = async function(email: string): Promise<boolean> {
  const _id = typeof(this._id) !== 'undefined' ? this._id : this.getFilter()._id;
  const user = await User.findOne({ email, _id: { $nin: [_id] } });
  return !user;
};

const validEmail = (email: string): boolean => {
  var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
};

const uniqueUsername = async function(username: string): Promise<boolean> {
  // excluimos el id del usuario que vamos a actualizar para no validar que se esta repitiendo el campo username
  const _id = typeof(this._id) !== 'undefined' ? this._id : this.getFilter()._id;
  const user = await User.findOne({ username, _id: { $nin: [_id] } });
  return !user;
};

const existInRole = async function(roles: any): Promise<boolean> {
  return await new Promise((resolve, reject) => {
    return resolve(roles.find( async (role: any) => {
      return !!await Role.findOne({ name: role.name});
    }));
  });
};

// Setter
const encryptPassword = (password: string) => {
  const salt = bcrypt.genSaltSync(10);
  const passwordDigest = bcrypt.hashSync(password, salt);
  return passwordDigest;
}

const setEmail = (email: string): string => {
  return email.toLocaleLowerCase();
}

// Schema
export const userSchema = new Schema({
  username: {
    type: String,
    required: '{PATH} is required',
    unique: true
  },
  email: {
    type: String,
    unique: true,
    set: setEmail
  },
  rfid: {
    type: String,
    unique: true,
  },

  profile: {
    firstName: {
      type: String,
      required: '{PATH} is required is required',
    },
    lastName: {
      type: String,
      required: '{PATH} is required is required',
    },
    dni: {
      type: String,
      required: '{PATH} is required is required',
    },
    avatar: {
      type: String
    },
  },
  password: {
    type: String,
    required: '{PATH} is required is required',
    minlength: [8, '{PATH} required a minimum of 8 characters'],
    set: encryptPassword
  },
  roles: [{
    _id: false,
    name:{
      type: String,
    },
    permissions:[{
      _id: false,
      name: {
        type: String
      }
    }]
  }],
  refreshToken: {
    type: String,
  },
  loginCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
});

userSchema.plugin(mongoosePaginate);

// Model
const User: PaginateModel<IUser> = model<IUser>('User', userSchema);

// Model methods
User.schema.method('isValidPassword', async function(thisUser: IUser, password: string): Promise<boolean>{
  try{
    return await bcrypt.compare(password, thisUser.password);
  } catch(err){
    throw new Error(err);
  }
});

// Model Validations
User.schema.path('email').validate(uniqueEmail, 'El {PATH} está en uso');
User.schema.path('email').validate(validEmail, 'El {PATH} debe ser de tipo email');
User.schema.path('username').validate(uniqueUsername, 'Este {PATH} ya está en uso');
// User.schema.path('roles').validate(existInRole, 'Este {PATH} es inválido');


export default User;
