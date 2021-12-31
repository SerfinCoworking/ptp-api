import Role from '../../models/role.model';

export const createRoles = async () => {

  const roles = [
    {
      "name": "dev",
      "grants": [
        {
          "resource": "role"
        },{
          "resource": "user"
        },{
          "resource": "employee"
        },{
          "resource": "objective"
        },{
          "resource": "schedule"
        },{
          "resource": "period"
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
    },{
      "name": "objective",
      "grants": [
        {
          "resource": "singed"
        }
      ]
    }
  ];
  console.log("Creating Roles...");
  await Promise.all(roles.map(async(role) => {
    await Role.create(role);
  }));
  console.log("==========End Creating Roles...=========");
}
