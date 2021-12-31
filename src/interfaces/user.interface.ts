import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';
export interface IUserRolePermission extends Document{
    name: string;
};
export interface IUserRole extends Document{
    name: string;
    permissions: Array<IUserRolePermission>;
};
export default interface IUser extends Document{
    username: string;
    email: string;
    rfid: string;
    profile: {
        firstName: string;
        lastName: string;
        dni: string;
        avatar: string;        
    };
    password: string;
    roles: Array<IUserRole>;
    refreshToken?: string;
    loginCount: number;
    createdAt?: Date;
    updatedAt?: Date;
    isValidPassword(storePassword: string, password: string): Promise<boolean>;
}
