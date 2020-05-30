import * as db from './dbconfig';
import Role from '../models/role.model';
import User from '../models/user.model';
import Employee from '../models/employee.model';


const seed = async () => {
  await db.initializeMongo();

  console.log("=========/** STARTING SEEDS... **/========");
  const sharedPermissions = [{ "resource": "employee" }];
  await Role.create({
    "name": "owner",
    "grants": [
      {
        "resource": "role"
      },
      {
        "resource": "user"
      },
      ...sharedPermissions
    ]
  });

  await Role.create({
    "name": "admin",
    "grants": [ ...sharedPermissions ]
  });

  await User.create({
    "username": "paul",
    "email": "paul@example.com",
    "role": "owner",
    "password": "12345678"
  });

  await User.create({
    "username": "eugenio",
    "email": "eugenio@example.com",
    "role": "owner",
    "password": "12345678"
  });

  await Employee.create({
    "enrollment": "2425",
    "profile": {
      "firstName": "Juan",
      "lastName": "Perez",
      "dni": "12345678",
      "avatar": "https://lh3.googleusercontent.com/proxy/s755euLDAgy3p985nG5wOzi3Jt8OHh2mG5JaB8N8yeeWGxceBAIE_GB1WVgUD5LrXXV3nktw8xjuB7hoDZsq3CplFftNeZwjUJTzhTf4JgDaQMUhlvaeXlos5ZyV7hlzqI3-GVA"
    },
    "contact": {
      "phones": [
        {
          "cod_area": "011",
          "number": "45452323"
        }
      ],
      "email": "juan.perez@example.com",
      "address": {
        "street": "Illinois av.",
        "city": "Chicago",
        "country": "USA",
        "zip": "1234"
      }
    }
  });

  console.log("=========/** FINISH SUCCESSFULLY! **/========");
}


seed();
