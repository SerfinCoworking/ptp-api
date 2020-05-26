import mongoose from 'mongoose';
import { env } from '../config/config';

export const initializeMongo = async(): Promise<void> => {
    const MONGO_URI = `${(process.env.MONGODB_URI || env.MONGODB_CONNECTION)}`;
    // mongoose.set('useFindAndModify', true);
    // mongoose.set('debug', true);
    try{

        const db = await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        });
        if(db) console.log('DB is connected');
    }catch(error){
        console.log(error);
    }
}
