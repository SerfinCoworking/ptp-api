import { Document } from 'mongoose';
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
    role:  string;
    refreshToken?: string;
    loginCount: number;
    createdAt?: Date;
    updatedAt?: Date;
    isValidPassword(thisUser: IUser, password: string): Promise<boolean>;
}
