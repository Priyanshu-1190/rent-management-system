const pool = require("../../config/db");

const generateMonthlyRent = async (tenancyId, month, year) => {
  // get unit rent
  const unitRes = await pool.query(
    `SELECT u.rent_amount, u.due_day
     FROM units u
     JOIN tenancies t ON t.unit_id = u.id
     WHERE t.id = $1`,
    [tenancyId]
  );

  const { rent_amount, due_day } = unitRes.rows[0];

  const dueDate = new Date(year, month - 1, due_day);

  const result = await pool.query(
    `INSERT INTO rent_schedules (tenancy_id, month, year, amount, due_date)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tenancy_id, month, year) DO NOTHING
     RETURNING *`,
    [tenancyId, month, year, rent_amount, dueDate]
  );

  return result.rows[0];
};

const addPayment = async (rentScheduleId, data) => {
  // Insert payment
  await pool.query(
    `INSERT INTO payments (rent_schedule_id, amount, payment_method, transaction_id)
     VALUES ($1, $2, $3, $4)`,
    [rentScheduleId, data.amount, data.method, data.txn_id]
  );

  // Get total paid
  const sumRes = await pool.query(
    `SELECT COALESCE(SUM(amount),0) as total_paid
     FROM payments WHERE rent_schedule_id = $1`,
    [rentScheduleId]
  );

  const totalPaid = sumRes.rows[0].total_paid;

  // Get total rent
  const rentRes = await pool.query(
    `SELECT amount FROM rent_schedules WHERE id = $1`,
    [rentScheduleId]
  );

  const totalRent = rentRes.rows[0].amount;

  let status = "pending";
  if (totalPaid >= totalRent) status = "paid";
  else if (totalPaid > 0) status = "partial";

  // Update rent schedule
  await pool.query(
    `UPDATE rent_schedules SET status = $1 WHERE id = $2`,
    [status, rentScheduleId]
  );

  return { totalPaid, status };
};

module.exports = { generateMonthlyRent, addPayment };