import mongoose from 'mongoose';
import { env } from '../../config/config';
import { IEvent, IPeriod, IShift } from '../../interfaces/schedule.interface';
import Period from '../../models/period.model';

// init db connections
const initializeMongo = (): void => {
    const MONGO_URI = `${(process.env.MONGODB_URI || env.MONGODB_CONNECTION)}`;
    mongoose.Promise = Promise;
    mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    }).then( mongoose => {
        console.log('DB is connected');
        migrate().then(() => {
            mongoose.disconnect();
        });
    });
}

async function migrate(){

    console.log(">> INICIANDO PROCESO DE ACTUALIZACIÓN...");

    const periods = await Period.find();
    
    try{
      
        await Promise.all( periods.map( async (period) => {
            await Promise.all(period.shifts.map( async (shift) => {
                await Promise.all(shift.events.map( async (event) => {
                    if(event.corrected){
                        event.checkin_corrected = true;
                        event.checkout_corrected = true;
                        const updatedEvent = await Period.findOneAndUpdate({_id: period._id},
                            { $set: { 
                                "shifts.$[outer].events.$[event]": event 
                            }
                        },
                        { 
                            arrayFilters: [
                                {"outer.employee._id": shift.employee._id},
                                {"event._id": event._id }
                            ],
                            new: true
                        },
                        (err, doc: IPeriod | null) => {
                          const targetShift: IShift | undefined = doc?.shifts.find((shiftRe: IShift) => shiftRe.employee._id.equals(shift.employee._id))
                          const result: IEvent | undefined = targetShift?.events.find((target: IEvent) => event._id && target._id?.equals(event._id));
                          console.log(result, "<=======Updated Event");
                        }
                        );
                    }
                }))
            }))
        }));

        console.log('>> FIN PROCESO =====================');
    }catch(err){
        console.log("UN ERROR OCURRIO ");
        console.log(err);
    }
}

initializeMongo();