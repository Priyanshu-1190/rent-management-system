const pool = require("../../config/db");
const { sendLateFeeNotice } = require("../../utils/email.service");

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const toNumber = (value) => Number(value || 0);

const getDueDate = (year, month, dueDay) => {
  const maxDay = new Date(year, month, 0).getDate();
  const safeDay = Math.min(dueDay, maxDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
};

const generateMonthlyRent = async (tenancyId, month, year) => {
  const unitRes = await pool.query(
    `SELECT u.rent_amount, u.due_day
     FROM units u
     JOIN tenancies t ON t.unit_id = u.id
     WHERE t.id = $1 AND t.is_active = TRUE`,
    [tenancyId]
  );

  const unit = unitRes.rows[0];
  if (!unit) {
    throw createHttpError(404, "Active tenancy not found");
  }

  const dueDate = getDueDate(year, month, unit.due_day);

  const result = await pool.query(
    `INSERT INTO rent_schedules (tenancy_id, month, year, amount, due_date)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tenancy_id, month, year) DO NOTHING
     RETURNING *`,
    [tenancyId, month, year, unit.rent_amount, dueDate]
  );

  if (!result.rows[0]) {
    throw createHttpError(409, "Rent already generated for this tenancy and month");
  }

  return result.rows[0];
};

const addPayment = async (rentScheduleId, data) => {
  const scheduleId = Number(rentScheduleId);
  if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
    throw createHttpError(400, "Valid rent schedule id is required");
  }

  const paymentAmount = toNumber(data.amount);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const rentRes = await client.query(
      `SELECT id, amount, late_fee, status
       FROM rent_schedules
       WHERE id = $1
       FOR UPDATE`,
      [scheduleId]
    );

    const schedule = rentRes.rows[0];
    if (!schedule) {
      throw createHttpError(404, "Rent schedule not found");
    }

    if (schedule.status === "paid") {
      throw createHttpError(400, "Rent schedule is already paid");
    }

    const sumRes = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid
       FROM payments
       WHERE rent_schedule_id = $1`,
      [scheduleId]
    );

    const paidBeforeThisPayment = toNumber(sumRes.rows[0].total_paid);
    const totalDue = toNumber(schedule.amount) + toNumber(schedule.late_fee);
    const outstandingBeforePayment = Math.max(totalDue - paidBeforeThisPayment, 0);

    if (paymentAmount > outstandingBeforePayment) {
      throw createHttpError(
        400,
        `Payment exceeds outstanding balance of ${outstandingBeforePayment.toFixed(2)}`
      );
    }

    await client.query(
      `INSERT INTO payments (rent_schedule_id, amount, payment_method, transaction_id)
       VALUES ($1, $2, $3, $4)`,
      [scheduleId, paymentAmount, data.method, data.txn_id || null]
    );

    const totalPaid = paidBeforeThisPayment + paymentAmount;
    let status = "pending";
    if (totalPaid >= totalDue) {
      status = "paid";
    } else if (totalPaid > 0) {
      status = "partial";
    }

    await client.query(
      `UPDATE rent_schedules
       SET status = $1
       WHERE id = $2`,
      [status, scheduleId]
    );

    await client.query("COMMIT");

    return {
      totalPaid,
      totalDue,
      outstanding: Math.max(totalDue - totalPaid, 0),
      status,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const applyLateFees = async () => {
  const result = await pool.query(`
    UPDATE rent_schedules rs
    SET late_fee = ROUND(rs.amount * 0.02, 2)
    WHERE CURRENT_DATE > rs.due_date
      AND rs.status != 'paid'
      AND COALESCE(rs.late_fee, 0) = 0
    RETURNING rs.id, rs.tenancy_id, rs.amount, rs.late_fee, rs.due_date
  `);

  if (result.rowCount === 0) {
    return { appliedCount: 0, notificationsSent: 0 };
  }

  const rentScheduleIds = result.rows.map((row) => row.id);
  const recipientRes = await pool.query(
    `SELECT rs.id, u.email
     FROM rent_schedules rs
     JOIN tenancies t ON t.id = rs.tenancy_id
     JOIN users u ON u.id = t.tenant_id
     WHERE rs.id = ANY($1::int[])`,
    [rentScheduleIds]
  );

  const emailByScheduleId = new Map(
    recipientRes.rows.map((row) => [row.id, row.email])
  );

  let notificationsSent = 0;
  for (const row of result.rows) {
    const email = emailByScheduleId.get(row.id);
    if (!email) {
      continue;
    }

    const sent = await sendLateFeeNotice(email, row.amount, row.late_fee, row.due_date);
    if (sent) {
      notificationsSent += 1;
    }
  }

  return { appliedCount: result.rowCount, notificationsSent };
};

module.exports = { generateMonthlyRent, addPayment, applyLateFees };
