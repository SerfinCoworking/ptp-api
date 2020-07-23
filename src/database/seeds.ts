import * as db from './dbconfig';

import { createRoles } from './seeds/roles';
import { createUsers } from './seeds/users';
import { createEmployees } from './seeds/employees';
import { createScheduleCalendar } from './seeds/schedules';


const seed = async () => {
  await db.initializeMongo();

  console.log("=========/** STARTING SEEDS... **/========");

  await createRoles();
  await createUsers();
  await createEmployees();
  await createScheduleCalendar();

  console.log("=========/** FINISH SUCCESSFULLY! **/========");
}


seed();
