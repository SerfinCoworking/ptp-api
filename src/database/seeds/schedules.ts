// import Event from '../../models/event.model';
// import Shift from '../../models/shift.model';
import Objective from '../../models/objective.model';
import Period from '../../models/period.model';
import Schedule from '../../models/schedule.model';
// import moment from 'moment';
import { IEvent, IShift, IPeriod, ISchedule } from '../../interfaces/schedule.interface';
import Employee from '../../models/employee.model';
import IEmployee from '../../interfaces/employee.interface';
import IObjective from '../../interfaces/objective.interface';
import { ObjectId } from 'mongodb';


// const createEvents = async (events: any): Promise<IEvent[]> => {
//   console.log("Creating Events...");
//   const createdEvents: IEvent[] = [];
//   await Promise.all(events.map(async(event: any) => {
//     const newRecord: IEvent = await Event.create(event);
//     createdEvents.push(newRecord);
//   }));
//   console.log("==========End Creating Event...=========");
//   return createdEvents;
// }

// const createShift = async (employee: IEmployee, events: IEvent[]): Promise<IShift[]> => {
//   console.log("Creating Shift...");
//   const shifts: IShift[] = [];
//   const shift: IShift = await Shift.create({
//     employee: {
//       _id: employee._id,
//       firstName: employee.profile.firstName,
//       lastName: employee.profile.lastName
//     },
//     events
//   });
//   shifts.push(shift);
//   console.log("==========End Creating Shift...=========");
//   return shifts;
// }

const createObjective = async (objective: any): Promise<IObjective> => {
  console.log("Creating Obejective...");
  const newRectord: IObjective = await Objective.create(objective);
  console.log("==========End Creating Objective...=========");
  return newRectord;
}

const createPeriod = async (period: any, shifts: IShift[], objective: IObjective): Promise<IPeriod> => {
  console.log("Creating Obejective...");
  const newRectord: IPeriod = await Period.create({
    fromDate: period.fromDate,
    toDate: period.toDate,
    shifts: shifts,
    objective: {
      _id: new ObjectId(objective._id),
      name: objective.name
    }
  });
  console.log("==========End Creating Objective...=========");
  return newRectord;
}

const createSchedule = async (objective: IObjective): Promise<ISchedule> => {
  console.log("Creating Schedule...");
  const newRectord: ISchedule = await Schedule.create({
    objective: {
      _id: new ObjectId(objective._id),
      name: objective.name
    }
  });
  console.log("==========End Creating Schedule...=========");
  return newRectord;
}

export const createScheduleCalendar = async () => {
  const events: IEvent[] = [
    {
      fromDatetime: new Date("2020-06-24 08:00:00"),
      toDatetime: new Date("2020-06-24 20:00:00")
    }, {
      fromDatetime: new Date("2020-06-26 08:00:00"),
      toDatetime: new Date("2020-06-26 20:00:00")
    }, {
      fromDatetime: new Date("2020-06-28 08:00:00"),
      toDatetime: new Date("2020-06-28 20:00:00")
    }
  ];

  const events2: IEvent[] = [
    {
      fromDatetime: new Date("2020-06-24 20:00:00"),
      toDatetime: new Date("2020-06-25 08:00:00")
    }, {
      fromDatetime: new Date("2020-06-26 20:00:00"),
      toDatetime: new Date("2020-06-27 08:00:00")
    }, {
      fromDatetime: new Date("2020-06-28 20:00:00"),
      toDatetime: new Date("2020-06-29 08:00:00")
    }
  ];

  const events3: IEvent[] = [
    {
      fromDatetime: new Date("2020-06-25 08:00:00"),
      toDatetime: new Date("2020-06-25 12:00:00")
    }, {
      fromDatetime: new Date("2020-06-25 16:00:00"),
      toDatetime: new Date("2020-06-25 20:00:00")
    },{
      fromDatetime: new Date("2020-06-27 08:00:00"),
      toDatetime: new Date("2020-06-27 12:00:00")
    }, {
      fromDatetime: new Date("2020-06-27 16:00:00"),
      toDatetime: new Date("2020-06-27 20:00:00")
    }
  ];

  const objectiveToCreate = {
    name: "Chapelco",
    address: {
      street: "chapelco",
      city: "San martin de los andes",
      zip: "8370"
    },
    serviceType: [{
      name: "Monitoreo",
      hours: "12"
    }],
    identifier: "chapelco",
    password: "12345678",
    role: "objective"
  };

  const periodDates = {
    fromDate: "2020-06-24",
    toDate: "2020-07-25"
  };

  const employees: IEmployee[] = await Employee.find().where("enrollment", ["2020", "2021", "2022"]);

  if(employees.length){

    const shifts: IShift[] = [{
      employee: {
        _id: new ObjectId(employees[0]._id),
        firstName: employees[0].profile.firstName,
        lastName: employees[0].profile.lastName
      },
      events: events
    }, {
      employee: {
        _id: new ObjectId(employees[1]._id),
        firstName: employees[1].profile.firstName,
        lastName: employees[1].profile.lastName
      },
      events: events2
    }, {
      employee: {
        _id: new ObjectId(employees[2]._id),
        firstName: employees[2].profile.firstName,
        lastName: employees[2].profile.lastName
      },
      events: events3
    }];

    const objective: IObjective = await createObjective(objectiveToCreate);
    const period: IPeriod = await createPeriod(periodDates, shifts, objective);
    const schedule: ISchedule = await createSchedule(objective);

    // console.log(events, "<=============== EVENTS");
    console.log(shifts, "<=============== SHIFTS");
    console.log(objective, "<=============== OBJECTIVE");
    console.log(period, "<=============== PERIOD");
    console.log(schedule, "<=============== SCHEDULE");
  }
}
