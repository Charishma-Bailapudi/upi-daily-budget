const cron = require("node-cron");
const { executeDailyRollover } = require("./rolloverService");

let rolloverTask;

function initCronJobs() {
  if (rolloverTask) {
    return rolloverTask;
  }

  rolloverTask = cron.schedule(
    "0 0 * * *",
    () => {
      executeDailyRollover().catch((error) => {
        console.error("Daily budget rollover job failed:", error);
      });
    },
    { timezone: "Asia/Kolkata" },
  );

  return rolloverTask;
}

module.exports = { initCronJobs };
