import _ from 'lodash';
export class BaseController {

  // mapping group of sort
  private sortingFields: any = [
    {'fullName_asc': {"profile.firstName": 1, "profile.lastName": 1}},
    {fullName_desc: {"profile.firstName": -1, "profile.lastName": -1}}
  ];

  // map sortMethod to a sort object (readeble for mongoose)
  async sortDigest(sortMethod: string, defaultSort?: { [key: string]: number} ){
    return await new Promise((resolve, reject) => {
      let sort: any = defaultSort;

      // 1 -DEFAULT:
      if(typeof sortMethod == 'undefined') resolve(sort);

      // 2 -INTO MAPPING GROUP:
      const defaultValue = _.find(this.sortingFields, sortMethod);
      if(defaultValue) resolve(defaultValue[sortMethod]);

      // 3 -CONVERT FROM SORTMETHOD
      const field = sortMethod.split("_")[0];
      const direction = sortMethod.split("_")[1];
      if(_.includes(['asc', 'desc'], direction)){
        sort[field] = direction === 'asc' ? 1 : -1;
      }

      resolve(sort);

    });
  }

  async searchDigest(search: string): Promise<string>{
    return await new Promise((resolve, reject) => {
        let target: string = typeof(search) !== 'undefined' ? decodeURIComponent(search) : '';
        target = target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        resolve(target);
      }
    )
  }

  //(security) filter null values and removes unpermit variables
  async filterNullValues(obj: any, permit: string[]): Promise<any> {
    const body: any = await _.pickBy(obj, (value, key:string) => {
      return (!_.isNil(value) && _.includes(permit, key));
    });
    return body;
  };
}
