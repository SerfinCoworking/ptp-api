const CronJob = require('cron').CronJob;
import { cronEmployeeSetBaja } from "../../modules/employeeStatus.module";


export const job = new CronJob('* * * * *', () => {
  console.log('You will see this message every second');
  cronEmployeeSetBaja();
});