import * as db from './dbconfig';

import { createRoles } from './seeds/roles';
import { createUsers } from './seeds/users';
import { createEmployees } from './seeds/employees';


const seed = async () => {
  await db.initializeMongo();

  console.log("=========/** STARTING SEEDS... **/========");

  await createRoles();
  await createUsers();
  await createEmployees();

  console.log("=========/** FINISH SUCCESSFULLY! **/========");
}


seed();
