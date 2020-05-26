import _ from 'lodash';
export class BaseController {

  //(security) filter null values and removes unpermit variables
  async filterNullValues(obj: any, permit: string[]): Promise<Array<string> | string> {
    const body: any = await _.pickBy(obj, (value, key:string) => {
      return (!_.isNil(value) && _.includes(permit, key));
    });
    return body;
  };
}
