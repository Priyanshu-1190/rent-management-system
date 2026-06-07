const pool = require("../../config/db");

const toNumber = (value) => Number(value || 0);
const isOutstandingStatus = (status) => ["pending", "partial", "overdue"].includes(status);

const getOwnerDashboard = async (ownerId) => {
  const propertyResult = await pool.query(
    `
    WITH unit_counts AS (
      SELECT
        properties.id AS property_id,
        COUNT(units.id) AS total_units,
        COUNT(tenancies.id) FILTER (WHERE tenancies.is_active = TRUE) AS occupied_units,
        COALESCE(SUM(units.rent_amount), 0) AS monthly_rent
      FROM properties
      LEFT JOIN units ON units.property_id = properties.id
      LEFT JOIN tenancies
        ON tenancies.unit_id = units.id
       AND tenancies.is_active = TRUE
      WHERE properties.owner_id = $1
      GROUP BY properties.id
    ),
    payment_totals AS (
      SELECT rent_schedule_id, SUM(amount) AS paid
      FROM payments
      WHERE status = 'success'
      GROUP BY rent_schedule_id
    ),
    rent_totals AS (
      SELECT
        properties.id AS property_id,
        COALESCE(SUM(COALESCE(payment_totals.paid, 0)), 0) AS total_collected,
        COALESCE(
          SUM(
            GREATEST(
              COALESCE(rent_schedules.amount, 0)
                + COALESCE(rent_schedules.late_fee, 0)
                - COALESCE(payment_totals.paid, 0),
              0
            )
          )
          FILTER (WHERE CURRENT_DATE >= (rent_schedules.due_date - INTERVAL '9 days')),
          0
        ) AS total_pending
      FROM properties
      LEFT JOIN units ON units.property_id = properties.id
      LEFT JOIN tenancies
        ON tenancies.unit_id = units.id
       AND tenancies.is_active = TRUE
      LEFT JOIN rent_schedules ON rent_schedules.tenancy_id = tenancies.id
      LEFT JOIN payment_totals ON payment_totals.rent_schedule_id = rent_schedules.id
      WHERE properties.owner_id = $1
      GROUP BY properties.id
    )
    SELECT
      properties.id AS property_id,
      properties.name AS property_name,
      COALESCE(unit_counts.total_units, 0) AS total_units,
      COALESCE(unit_counts.occupied_units, 0) AS occupied_units,
      COALESCE(unit_counts.monthly_rent, 0) AS total_rent,
      COALESCE(rent_totals.total_collected, 0) AS total_collected,
      COALESCE(rent_totals.total_pending, 0) AS total_pending
    FROM properties
    LEFT JOIN unit_counts ON unit_counts.property_id = properties.id
    LEFT JOIN rent_totals ON rent_totals.property_id = properties.id
    WHERE properties.owner_id = $1
    ORDER BY properties.created_at DESC, properties.id DESC
    `,
    [ownerId]
  );

  const statusResult = await pool.query(
    `
    WITH payment_totals AS (
      SELECT rent_schedule_id, SUM(amount) AS paid
      FROM payments
      WHERE status = 'success'
      GROUP BY rent_schedule_id
    )
    SELECT
      rent_schedules.id AS rent_id,
      properties.id AS property_id,
      properties.name AS property_name,
      units.id AS unit_id,
      units.name AS unit_name,
      tenant.id AS tenant_id,
      tenant.name AS tenant_name,
      rent_schedules.month,
      rent_schedules.year,
      rent_schedules.amount,
      COALESCE(rent_schedules.late_fee, 0) AS late_fee,
      rent_schedules.amount + COALESCE(rent_schedules.late_fee, 0) AS total_due,
      rent_schedules.status,
      COALESCE(payment_totals.paid, 0) AS paid,
      GREATEST(
        rent_schedules.amount + COALESCE(rent_schedules.late_fee, 0) - COALESCE(payment_totals.paid, 0),
        0
      ) AS pending,
      CASE
        WHEN COALESCE(payment_totals.paid, 0) < rent_schedules.amount + COALESCE(rent_schedules.late_fee, 0)
         AND CURRENT_DATE >= (rent_schedules.due_date - INTERVAL '9 days')
         AND CURRENT_DATE <= rent_schedules.due_date
        THEN (rent_schedules.due_date - CURRENT_DATE)
        ELSE NULL
      END AS due_in_days,
      CASE
        WHEN COALESCE(payment_totals.paid, 0) < rent_schedules.amount + COALESCE(rent_schedules.late_fee, 0)
         AND CURRENT_DATE > rent_schedules.due_date
        THEN (CURRENT_DATE - rent_schedules.due_date)
        ELSE NULL
      END AS overdue_by_days,
      CASE
        WHEN COALESCE(payment_totals.paid, 0) >= rent_schedules.amount + COALESCE(rent_schedules.late_fee, 0) THEN 'paid'
        WHEN COALESCE(payment_totals.paid, 0) > 0 THEN 'partial'
        WHEN CURRENT_DATE > rent_schedules.due_date THEN 'overdue'
        WHEN CURRENT_DATE >= (rent_schedules.due_date - INTERVAL '9 days') THEN 'pending'
        ELSE 'upcoming'
      END AS payment_status
    FROM rent_schedules
    INNER JOIN tenancies ON tenancies.id = rent_schedules.tenancy_id
    INNER JOIN users AS tenant ON tenant.id = tenancies.tenant_id
    INNER JOIN units ON units.id = tenancies.unit_id
    INNER JOIN properties ON properties.id = units.property_id
    LEFT JOIN payment_totals ON payment_totals.rent_schedule_id = rent_schedules.id
    WHERE properties.owner_id = $1
      AND tenancies.is_active = TRUE
    ORDER BY rent_schedules.year DESC, rent_schedules.month DESC, properties.name, units.name
    `,
    [ownerId]
  );

  const properties = propertyResult.rows.map((property) => ({
    ...property,
    total_units: toNumber(property.total_units),
    occupied_units: toNumber(property.occupied_units),
    total_rent: toNumber(property.total_rent),
    total_collected: toNumber(property.total_collected),
    total_pending: toNumber(property.total_pending),
  }));

  const paymentResult = await pool.query(
    `
    SELECT
      payments.id AS payment_id,
      payments.rent_schedule_id AS rent_id,
      payments.amount,
      payments.payment_method,
      payments.payment_date,
      payments.transaction_id,
      payments.status
    FROM payments
    INNER JOIN rent_schedules ON rent_schedules.id = payments.rent_schedule_id
    INNER JOIN tenancies ON tenancies.id = rent_schedules.tenancy_id
    INNER JOIN units ON units.id = tenancies.unit_id
    INNER JOIN properties ON properties.id = units.property_id
    WHERE properties.owner_id = $1
    ORDER BY payments.payment_date DESC, payments.id DESC
    `,
    [ownerId]
  );

  const paymentsByRent = paymentResult.rows.reduce((acc, payment) => {
    const rentId = payment.rent_id;
    if (!acc[rentId]) acc[rentId] = [];

    acc[rentId].push({
      ...payment,
      amount: toNumber(payment.amount),
    });

    return acc;
  }, {});

  const rent_status = statusResult.rows.map((rent) => ({
    ...rent,
    amount: toNumber(rent.amount),
    late_fee: toNumber(rent.late_fee),
    total_due: toNumber(rent.total_due),
    paid: toNumber(rent.paid),
    pending: toNumber(rent.pending),
    due_in_days: rent.due_in_days === null ? null : Number(rent.due_in_days),
    overdue_by_days: rent.overdue_by_days === null ? null : Number(rent.overdue_by_days),
    payments: paymentsByRent[rent.rent_id] || [],
  }));

  const totals = properties.reduce(
    (acc, property) => ({
      total_properties: acc.total_properties + 1,
      total_units: acc.total_units + property.total_units,
      occupied_units: acc.occupied_units + property.occupied_units,
      total_rent: acc.total_rent + property.total_rent,
      total_collected: acc.total_collected + property.total_collected,
      total_pending: acc.total_pending + property.total_pending,
    }),
    {
      total_properties: 0,
      total_units: 0,
      occupied_units: 0,
      total_rent: 0,
      total_collected: 0,
      total_pending: 0,
    }
  );

  return { totals, properties, rent_status };
};

const getTenantDashboard = async (tenantId) => {
  const rentResult = await pool.query(
    `
    WITH payment_totals AS (
      SELECT rent_schedule_id, SUM(amount) AS paid
      FROM payments
      WHERE status = 'success'
      GROUP BY rent_schedule_id
    )
    SELECT
      rent_schedules.id AS rent_id,
      properties.name AS property_name,
      units.name AS unit_name,
      rent_schedules.month,
      rent_schedules.year,
      rent_schedules.amount,
      COALESCE(rent_schedules.late_fee, 0) AS late_fee,
      rent_schedules.amount + COALESCE(rent_schedules.late_fee, 0) AS total_due,
      rent_schedules.due_date,
      rent_schedules.status,
      COALESCE(payment_totals.paid, 0) AS paid,
      GREATEST(
        rent_schedules.amount + COALESCE(rent_schedules.late_fee, 0) - COALESCE(payment_totals.paid, 0),
        0
      ) AS pending,
      CASE
        WHEN COALESCE(payment_totals.paid, 0) < rent_schedules.amount + COALESCE(rent_schedules.late_fee, 0)
         AND CURRENT_DATE >= (rent_schedules.due_date - INTERVAL '9 days')
         AND CURRENT_DATE <= rent_schedules.due_date
        THEN (rent_schedules.due_date - CURRENT_DATE)
        ELSE NULL
      END AS due_in_days,
      CASE
        WHEN COALESCE(payment_totals.paid, 0) < rent_schedules.amount + COALESCE(rent_schedules.late_fee, 0)
         AND CURRENT_DATE > rent_schedules.due_date
        THEN (CURRENT_DATE - rent_schedules.due_date)
        ELSE NULL
      END AS overdue_by_days,
      CASE
        WHEN COALESCE(payment_totals.paid, 0) >= rent_schedules.amount + COALESCE(rent_schedules.late_fee, 0) THEN 'paid'
        WHEN COALESCE(payment_totals.paid, 0) > 0 THEN 'partial'
        WHEN CURRENT_DATE > rent_schedules.due_date THEN 'overdue'
        WHEN CURRENT_DATE >= (rent_schedules.due_date - INTERVAL '9 days') THEN 'pending'
        ELSE 'upcoming'
      END AS payment_status
    FROM tenancies
    INNER JOIN units ON units.id = tenancies.unit_id
    INNER JOIN properties ON properties.id = units.property_id
    INNER JOIN rent_schedules ON rent_schedules.tenancy_id = tenancies.id
    LEFT JOIN payment_totals ON payment_totals.rent_schedule_id = rent_schedules.id
    WHERE tenancies.tenant_id = $1
    ORDER BY rent_schedules.year DESC, rent_schedules.month DESC, rent_schedules.id DESC
    `,
    [tenantId]
  );

  const paymentResult = await pool.query(
    `
    SELECT
      payments.id AS payment_id,
      payments.rent_schedule_id AS rent_id,
      payments.amount,
      payments.payment_method,
      payments.payment_date,
      payments.transaction_id,
      payments.status
    FROM payments
    INNER JOIN rent_schedules ON rent_schedules.id = payments.rent_schedule_id
    INNER JOIN tenancies ON tenancies.id = rent_schedules.tenancy_id
    WHERE tenancies.tenant_id = $1
    ORDER BY payments.payment_date DESC, payments.id DESC
    `,
    [tenantId]
  );

  const paymentsByRent = paymentResult.rows.reduce((acc, payment) => {
    const rentId = payment.rent_id;
    if (!acc[rentId]) acc[rentId] = [];

    acc[rentId].push({
      ...payment,
      amount: toNumber(payment.amount),
    });

    return acc;
  }, {});

  const rent_history = rentResult.rows.map((rent) => ({
    ...rent,
    amount: toNumber(rent.amount),
    late_fee: toNumber(rent.late_fee),
    total_due: toNumber(rent.total_due),
    paid: toNumber(rent.paid),
    pending: toNumber(rent.pending),
    due_in_days: rent.due_in_days === null ? null : Number(rent.due_in_days),
    overdue_by_days: rent.overdue_by_days === null ? null : Number(rent.overdue_by_days),
    payments: paymentsByRent[rent.rent_id] || [],
  }));

  const summary = rent_history.reduce(
    (acc, rent) => ({
      total_rent: acc.total_rent + rent.amount,
      total_paid: acc.total_paid + rent.paid,
      total_pending: acc.total_pending + (isOutstandingStatus(rent.payment_status) ? rent.pending : 0),
    }),
    { total_rent: 0, total_paid: 0, total_pending: 0 }
  );

  const activeTenancyResult = await pool.query(
    `SELECT 
       properties.id AS property_id,
       properties.name AS property_name,
       properties.address AS property_address,
       properties.lease_agreement,
       units.name AS unit_name,
       tenancies.move_in_date,
       tenancies.deposit
     FROM tenancies
     INNER JOIN units ON units.id = tenancies.unit_id
     INNER JOIN properties ON properties.id = units.property_id
     WHERE tenancies.tenant_id = $1 AND tenancies.is_active = TRUE
     LIMIT 1`,
    [tenantId]
  );

  const active_tenancy = activeTenancyResult.rows[0] ? {
    ...activeTenancyResult.rows[0],
    deposit: toNumber(activeTenancyResult.rows[0].deposit)
  } : null;

  return { summary, rent_history, active_tenancy };
};

module.exports = { getOwnerDashboard, getTenantDashboard };

