import { ObjectID } from 'mongodb';
import { Document } from 'mongoose';

export interface IUserMovement extends Document {
    _id: ObjectID;
    username: string;
    profile: {
        firstName: string;
        lastName: string;
        dni: string;
    }
}
  
export default interface IMovement extends Document{
    user: IUserMovement;
    action: string;
    resource: string;
    target: string;
    createdAt?: Date;
    updatedAt?: Date;
}