import { Document } from 'mongoose';
import { ObjectID } from 'mongodb';
export default interface IUser extends Document{
    username: string;
    email: string;
    password: string;
    role:  string;
    refreshToken?: string;
    createdAt?: Date;
    updatedAt?: Date;
    isValidPassword(thisUser: IUser, password: string): Promise<boolean>;
}
