const CronJob = require('cron').CronJob;
import { cronEmployeeSetBaja } from "../../modules/employeeStatus.module";


export const job = new CronJob('0 0 * * *', () => {
  cronEmployeeSetBaja();
});