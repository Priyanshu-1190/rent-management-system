const pool = require("../../config/db");
const { sendLateFeeNotice } = require("../../utils/email.service");

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const toNumber = (value) => Number(value || 0);

const addMonths = (dateStr, months) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1 + months, day);
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + 1;
  const maxDay = new Date(targetYear, targetMonth, 0).getDate();
  const safeDay = Math.min(day, maxDay);
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
};

const getDueDate = (year, month, moveInDateStr) => {
  const moveInParts = String(moveInDateStr || "").split("-");
  const parsedDay = Number(moveInParts[2]);
  const parsedYear = Number(moveInParts[0]);
  const parsedMonth = Number(moveInParts[1]);
  const fallbackDay = new Date(moveInDateStr).getDate();
  const joinDay = Number.isInteger(parsedDay) && parsedDay > 0 ? parsedDay : fallbackDay;
  const moveInDate = Number.isInteger(parsedYear) && Number.isInteger(parsedMonth) && Number.isInteger(parsedDay)
    ? new Date(parsedYear, parsedMonth - 1, parsedDay)
    : new Date(moveInDateStr);

  const getAnniversary = (targetYear, targetMonth, day) => {
    const maxAnniversaryDay = new Date(targetYear, targetMonth, 0).getDate();
    const safeDay = Math.min(day, maxAnniversaryDay);
    return new Date(targetYear, targetMonth - 1, safeDay);
  };

  let anniversary = getAnniversary(year, month, joinDay);

  // Due date is the first valid join-cycle anniversary strictly after move-in.
  let guard = 0;
  while (anniversary <= moveInDate && guard < 36) {
    const nextMonthAnchor = new Date(anniversary.getFullYear(), anniversary.getMonth() + 1, 1);
    anniversary = getAnniversary(
      nextMonthAnchor.getFullYear(),
      nextMonthAnchor.getMonth() + 1,
      joinDay
    );
    guard += 1;
  }

  return `${anniversary.getFullYear()}-${String(anniversary.getMonth() + 1).padStart(2, "0")}-${String(anniversary.getDate()).padStart(2, "0")}`;
};

const getPaymentStatus = (totalPaid, totalDue) => {
  if (totalPaid >= totalDue) {
    return "paid";
  }

  if (totalPaid > 0) {
    return "partial";
  }

  return "pending";
};

const generateMonthlyRent = async (tenancyId, month, year) => {
  const unitRes = await pool.query(
    `SELECT u.rent_amount, t.move_in_date
     FROM units u
     JOIN tenancies t ON t.unit_id = u.id
     WHERE t.id = $1 AND t.is_active = TRUE`,
    [tenancyId]
  );

  const unit = unitRes.rows[0];
  if (!unit) {
    throw createHttpError(404, "Active tenancy not found");
  }

  // Get existing rent schedules for this tenancy
  const existingSchedulesRes = await pool.query(
    `SELECT month, year, due_date
     FROM rent_schedules
     WHERE tenancy_id = $1
     ORDER BY year DESC, month DESC`,
    [tenancyId]
  );

  let dueDate;
  if (existingSchedulesRes.rows.length > 0) {
    const latest = existingSchedulesRes.rows[0];
    const latestVal = latest.year * 12 + latest.month;
    const targetVal = year * 12 + month;
    if (targetVal > latestVal) {
      const diff = targetVal - latestVal;
      dueDate = addMonths(latest.due_date, diff);
    } else {
      dueDate = getDueDate(year, month, unit.move_in_date);
    }
  } else {
    // No existing schedules. Find first due date strictly after move-in.
    const moveInParts = String(unit.move_in_date || "").split("-");
    const moveInYear = Number(moveInParts[0]);
    const moveInMonth = Number(moveInParts[1]);
    const d0 = getDueDate(moveInYear, moveInMonth, unit.move_in_date);
    dueDate = d0;
  }

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

    const sumRes = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid
       FROM payments
       WHERE rent_schedule_id = $1
         AND status = 'success'`,
      [scheduleId]
    );

    const paidBeforeThisPayment = toNumber(sumRes.rows[0].total_paid);
    const totalDue = toNumber(schedule.amount) + toNumber(schedule.late_fee);
    const statusBeforePayment = getPaymentStatus(paidBeforeThisPayment, totalDue);
    const outstandingBeforePayment = Math.max(totalDue - paidBeforeThisPayment, 0);

    if (statusBeforePayment === "paid") {
      throw createHttpError(400, "Rent schedule is already paid");
    }

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
    const status = getPaymentStatus(totalPaid, totalDue);

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
    SET late_fee = ROUND(rs.amount * (u.late_fee_percentage / 100.0), 2)
    FROM tenancies t
    JOIN units u ON u.id = t.unit_id
    WHERE rs.tenancy_id = t.id
      AND rs.status != 'paid'
      AND COALESCE(rs.late_fee, 0) = 0
      AND u.late_fee_percentage > 0
      AND CURRENT_DATE > (rs.due_date + (COALESCE(u.grace_period_days, 0) || ' days')::INTERVAL)::DATE
    RETURNING rs.id, rs.tenancy_id, rs.amount, rs.late_fee, rs.due_date
  `);

  if (result.rowCount === 0) {
    return { appliedCount: 0, notificationsSent: 0 };
  }

  const rentScheduleIds = result.rows.map((row) => row.id);
  const recipientRes = await pool.query(
    `SELECT rs.id, u.email, un.late_fee_percentage
     FROM rent_schedules rs
     JOIN tenancies t ON t.id = rs.tenancy_id
     JOIN units un ON un.id = t.unit_id
     JOIN users u ON u.id = t.tenant_id
     WHERE rs.id = ANY($1::int[])`,
    [rentScheduleIds]
  );

  const emailByScheduleId = new Map(
    recipientRes.rows.map((row) => [row.id, { email: row.email, percentage: row.late_fee_percentage }])
  );

  let notificationsSent = 0;
  for (const row of result.rows) {
    const info = emailByScheduleId.get(row.id);
    if (!info || !info.email) {
      continue;
    }

    const sent = await sendLateFeeNotice(info.email, row.amount, row.late_fee, row.due_date, info.percentage);
    if (sent) {
      notificationsSent += 1;
    }
  }

  return { appliedCount: result.rowCount, notificationsSent };
};

const autoGenerateRentSchedules = async () => {
  // Get all active tenancies
  const activeTenanciesRes = await pool.query(
    `SELECT id, move_in_date FROM tenancies WHERE is_active = TRUE`
  );

  const now = new Date();
  const targetYear = now.getFullYear();
  const targetMonth = now.getMonth() + 1; // 1-indexed current month

  for (const tenancy of activeTenanciesRes.rows) {
    const tenancyId = tenancy.id;
    const moveInDate = tenancy.move_in_date;

    if (!moveInDate) continue;

    // Get the latest generated rent schedule for this tenancy
    const latestRes = await pool.query(
      `SELECT month, year FROM rent_schedules
       WHERE tenancy_id = $1
       ORDER BY year DESC, month DESC
       LIMIT 1`,
      [tenancyId]
    );

    let startMonth, startYear;
    if (latestRes.rows.length > 0) {
      const latest = latestRes.rows[0];
      startMonth = latest.month + 1;
      startYear = latest.year;
      if (startMonth > 12) {
        startMonth = 1;
        startYear++;
      }
    } else {
      const parts = moveInDate.split("-").map(Number);
      startYear = parts[0];
      startMonth = parts[1];
    }

    let currMonth = startMonth;
    let currYear = startYear;

    // Generate up to target month/year
    while (currYear < targetYear || (currYear === targetYear && currMonth <= targetMonth)) {
      try {
        await generateMonthlyRent(tenancyId, currMonth, currYear);
      } catch (err) {
        // Ignore duplicate rent schedules error (status 409)
        if (err.status !== 409) {
          console.error(`[Auto-Generate] Failed for tenancy ${tenancyId}, period ${currMonth}/${currYear}:`, err.message);
        }
      }

      currMonth++;
      if (currMonth > 12) {
        currMonth = 1;
        currYear++;
      }
    }
  }
};

module.exports = { generateMonthlyRent, addPayment, applyLateFees, autoGenerateRentSchedules };
