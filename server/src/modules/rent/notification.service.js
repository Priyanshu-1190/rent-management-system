const pool = require("../../config/db");
const { sendReminder } = require("../../utils/email.service");

const sendRentReminders = async () => {
  const result = await pool.query(`
    SELECT u.email, rs.amount, rs.due_date
    FROM rent_schedules rs
    JOIN tenancies t ON t.id = rs.tenancy_id
    JOIN users u ON u.id = t.tenant_id
    WHERE rs.status = 'pending'
      AND t.is_active = TRUE
      AND rs.due_date = CURRENT_DATE + 2
    ORDER BY rs.due_date ASC, rs.id ASC
  `);

  console.log(`[REMINDER] Found ${result.rows.length} upcoming rent(s) due in 2 days`);

  let sentCount = 0;
  for (const row of result.rows) {
    const sent = await sendReminder(row.email, row.amount, row.due_date);
    if (sent) {
      sentCount += 1;
    }
  }

  console.log(`[REMINDER] Reminder job complete (${sentCount}/${result.rows.length} sent)`);
  return { dueCount: result.rows.length, sentCount };
};

module.exports = { sendRentReminders };
