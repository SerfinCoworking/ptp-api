import { Document } from 'mongoose';
import { IProfile } from './embedded.documents.inteface';
export default interface IUser extends Document{
    username: string;
    email: string;
    rfid: string;
    profile: IProfile;
    password: string;
    avatar: string;
    role:  string;
    refreshToken?: string;
    loginCount: number;
    createdAt?: Date;
    updatedAt?: Date;
    isValidPassword(thisUser: IUser, password: string): Promise<boolean>;
}
