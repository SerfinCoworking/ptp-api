import { Document } from 'mongoose';
import { IAddress, IServiceType, IDefaultSchedule } from './embedded.documents.inteface';
import { IUserRole } from './user.interface';

export default interface IObjective extends Document {
  name: string;
  identifier: string;
  address: IAddress;
  serviceType: IServiceType[];
  description?: string;
  avatar?: string;
  password: string;
  role:  IUserRole;
  refreshToken?: string;
  loginCount: number;
  defaultSchedules: IDefaultSchedule[];
  createdAt?: Date;
  updatedAt?: Date;
}

