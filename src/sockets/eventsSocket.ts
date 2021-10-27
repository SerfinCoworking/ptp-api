import { IEvent, IPeriod, IShift } from "../interfaces/schedule.interface";
import Period from '../models/period.model';
import { Socket, Server } from "socket.io";

module.exports.updateEvent = function(io: Server, socket: Socket): void {

  socket.on("event:update", (data) => {
    const {periodId, employeeId, event} = data;
    Period.findOneAndUpdate({_id: periodId},
      { $set: { "shifts.$[outer].events.$[event]": { ...event } }},
      { 
        arrayFilters: [
          {"outer.employee._id": employeeId},
          {"event._id": event._id }
        ],
        new: true
      },
      (err, doc: IPeriod | null) => {
        const shift: IShift | undefined = doc?.shifts.find((shift: IShift) => shift.employee._id.equals(employeeId))
        const result: IEvent | undefined = shift?.events.find((target: IEvent) => event._id && target._id?.equals(event._id));
        io.emit("event:update", { text: "Fichado actualizado correctamente",  employeeId, event: result });
      });
  });
    
    
    

}
