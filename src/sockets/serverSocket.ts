import { Server } from "http";
import { Server as ServerIo } from "socket.io";
const eventsHandler = require('./eventsSocket');

export class ServerSocket {

  private io: ServerIo;

  constructor(private serve: Server){
    this.io = new ServerIo(this.serve);
  }

  connect(): void {
    this.io.on('connection', (socket) => {
      console.log('A user connected ========================');
      eventsHandler.updateEvent(this.io, socket); // update event
      
      //Whenever someone disconnects this piece of code executed
      socket.on('disconnect', function () {
        console.log('A user disconnected');
      });
    });
  }
}