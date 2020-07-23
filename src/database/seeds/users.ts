import User from '../../models/user.model';

const users = [
  {
    "username": "paul",
    "email": "paul@example.com",
    "role": "dev",
    "password": "12345678",
    "profile": {
      "firstName": "Paul",
      "lastName": "Ibaceta",
      "avatar": "https://image.shutterstock.com/image-vector/social-member-vector-icon-person-260nw-1139787308.jpg",
      "dni": "37458993",
    }
  },{
    "username": "eugenio",
    "email": "eugenio@example.com",
    "role": "dev",
    "password": "12345678",
    "profile": {
      "firstName": "Eugenio",
      "lastName": "Eugenio",
      "avatar": "https://image.shutterstock.com/image-vector/social-member-vector-icon-person-260nw-1139787308.jpg",
      "dni": "12345678",
    }
  }
]


export const createUsers = async () => {
  console.log("Creating Users...");
  await Promise.all(users.map(async(user) => {
    await User.create(user);
  }));
  console.log("==========End Creating User...=========");
}
