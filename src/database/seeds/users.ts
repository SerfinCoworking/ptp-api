import User from '../../models/user.model';

const users = [
  {
    "username": "paul",
    "email": "paul@example.com",
    "role": "owner",
    "password": "12345678"
  },{
    "username": "eugenio",
    "email": "eugenio@example.com",
    "role": "owner",
    "password": "12345678"
  }
]


export const createUsers = async () => {
  console.log("Creating Users...");
  await Promise.all(users.map(async(user) => {
    await User.create(user);
  }));
  console.log("==========End Creating User...=========");
}
