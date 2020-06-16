import User from '../../models/user.model';

const users = [
  {
    "username": "paul",
    "email": "paul@example.com",
    "avatar": "https://www.google.com.ar/url?sa=i&url=https%3A%2F%2Fwww.tutored.me%2Fes%2Fjava-developer-que-es%2F&psig=AOvVaw1SYFQF99hD7Lu1guQZ-3oY&ust=1592434571074000&source=images&cd=vfe&ved=0CAIQjRxqFwoTCOjwg5u3h-oCFQAAAAAdAAAAABAO",
    "role": "owner",
    "password": "12345678"
  },{
    "username": "eugenio",
    "email": "eugenio@example.com",
    "avatar": "https://www.google.com.ar/url?sa=i&url=https%3A%2F%2Fwww.tutored.me%2Fes%2Fjava-developer-que-es%2F&psig=AOvVaw1SYFQF99hD7Lu1guQZ-3oY&ust=1592434571074000&source=images&cd=vfe&ved=0CAIQjRxqFwoTCOjwg5u3h-oCFQAAAAAdAAAAABAO",
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
