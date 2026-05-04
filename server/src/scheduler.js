const cron = require("node-cron");
const { applyLateFees } = require("./modules/rent/rent.service");
const { sendRentReminders } = require("./modules/rent/notification.service");

const schedulerTimezone = process.env.SCHEDULER_TIMEZONE || "Asia/Kolkata";

/**
 * Initialize all scheduled jobs.
 * Called once from index.js at server startup.
 */
const initScheduler = () => {
  // Apply late fees daily at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Running late fee job...");
    try {
      const { appliedCount, notificationsSent } = await applyLateFees();
      console.log(
        `[CRON] Late fees applied to ${appliedCount} overdue rent(s); ${notificationsSent} notice(s) sent`
      );
    } catch (error) {
      console.error("[CRON ERROR] Late fee job failed:", error.message);
    }
  }, { timezone: schedulerTimezone });

  // Send rent reminders daily at 9 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("[CRON] Running rent reminder job...");
    try {
      const { dueCount, sentCount } = await sendRentReminders();
      console.log(`[CRON] Reminder job processed ${dueCount} rent(s); ${sentCount} reminder(s) sent`);
    } catch (error) {
      console.error("[CRON ERROR] Reminder job failed:", error.message);
    }
  }, { timezone: schedulerTimezone });

  console.log(
    `[SCHEDULER] Cron jobs registered (late fees @midnight, reminders @9AM, timezone ${schedulerTimezone})`
  );
};

module.exports = { initScheduler };
