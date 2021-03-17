import { AccessControl } from 'role-acl';
import IRole from '../interfaces/role.interface';
import Role from '../models/role.model';
// Create new instance

class Permissions {
  private  access: any;
  constructor(){
    this.access = new AccessControl();
  }

  // initialize = async () => {
  //   const roles = await Role.find();

  //   const grantList: any = {};
  //   await Promise.all( roles.map( async ( role: IRole) => {
  //     grantList[`${role.name}`] = {grants: role.grants};
  //   }));

  //   let objList = JSON.parse(JSON.stringify(grantList)); //fix (lodash.clonedeep,is a dependencie of role-acl), https://github.com/Automattic/mongoose/issues/6507

  //   this.access.setGrants(objList);
  //   console.log("Grants initialized");
  // }

  getAccessControl(): AccessControl{
    return this.access;
  }
}

export const permissions: Permissions = new Permissions();

export default permissions.getAccessControl();
