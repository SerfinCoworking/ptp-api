import Role from '../../models/role.model';
import User from '../../models/user.model';
const roles = [
  {
    "name": "owner",
    "grants": [
      {
        "resource": "role"
      },{
        "resource": "user"
      },{
        "resource": "employee"
      }
    ]
  },{
    "name": "admin",
    "grants": [
      {
        "resource": "user"
      },{
        "resource": "employee"
      }
    ]
  }
]


export const createRoles = async () => {
  console.log("Creating Roles...");
  await Promise.all(roles.map(async(role) => {
    await Role.create(role);
  }));
  console.log("==========End Creating Roles...=========");
}
