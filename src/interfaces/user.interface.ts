import { Document } from 'mongoose';
import { IProfile } from './embedded.documents.inteface';
export default interface IUser extends Document{
    username: string;
    email: string;
    profile: IProfile;
    password: string;
    avatar: string;
    role:  string;
    refreshToken?: string;
    createdAt?: Date;
    updatedAt?: Date;
    isValidPassword(thisUser: IUser, password: string): Promise<boolean>;
}
