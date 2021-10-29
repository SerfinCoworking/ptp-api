import { IEvent, IPeriod, IShift } from "../interfaces/schedule.interface";
import Period from '../models/period.model';
import { Socket, Server } from "socket.io";
import moment from "moment";
import Employee from "../models/employee.model";
import IEmployee from "../interfaces/employee.interface";
import { ObjectId } from "mongodb";
const eventSigns = require('../modules/signs.module');


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
      io.emit("event:update", { text: "Fichado actualizado correctamente",  event: result });
    });
  });
}

module.exports.userSigning = function(io: Server, socket: Socket): void {

  socket.on("user:signing", (data) => {
    
    eventSigns.getUserSignedEvent(data).then((result: {event: IEvent, periodId: ObjectId, employeeId: ObjectId}) => {
      Period.findOneAndUpdate({_id: result.periodId},
        { $set: { "shifts.$[outer].events.$[event]": result.event }},
        { 
          arrayFilters: [
            {"outer.employee._id": result.employeeId},
            {"event._id": result.event._id }
          ],
          new: true
        },
        (err, doc: IPeriod | null) => {
          const shift: IShift | undefined = doc?.shifts.find((shift: IShift) => shift.employee._id.equals(result.employeeId))
          const event: IEvent | undefined = shift?.events.find((target: IEvent) => result.event._id && target._id?.equals(result.event._id));
          io.emit("event:update", { text: "Fichado actualizado correctamente",  event: event });
        }
      );
    });
  });
}
    
    
    

