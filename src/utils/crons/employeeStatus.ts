const CronJob = require('cron').CronJob;

export const job = new CronJob('* * * * *', () => {
  console.log('You will see this message every second');
});
// export job;