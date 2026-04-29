const pool = require("../../config/db");

const toNumber = (value) => Number(value || 0);

const getOwnerDashboard = async (ownerId) => {
  const propertyResult = await pool.query(
    `
    WITH unit_counts AS (
      SELECT
        properties.id AS property_id,
        COUNT(units.id) AS total_units,
        COUNT(tenancies.id) FILTER (WHERE tenancies.is_active = TRUE) AS occupied_units
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
      GROUP BY rent_schedule_id
    ),
    rent_totals AS (
      SELECT
        properties.id AS property_id,
        COALESCE(SUM(rent_schedules.amount), 0) AS total_rent,
        COALESCE(SUM(COALESCE(payment_totals.paid, 0)), 0) AS total_collected,
        COALESCE(
          SUM(GREATEST(rent_schedules.amount - COALESCE(payment_totals.paid, 0), 0)),
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
      COALESCE(rent_totals.total_rent, 0) AS total_rent,
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
      rent_schedules.status,
      COALESCE(payment_totals.paid, 0) AS paid,
      GREATEST(rent_schedules.amount - COALESCE(payment_totals.paid, 0), 0) AS pending,
      CASE
        WHEN COALESCE(payment_totals.paid, 0) >= rent_schedules.amount THEN 'paid'
        WHEN COALESCE(payment_totals.paid, 0) > 0 THEN 'partial'
        ELSE 'pending'
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

  const rent_status = statusResult.rows.map((rent) => ({
    ...rent,
    amount: toNumber(rent.amount),
    paid: toNumber(rent.paid),
    pending: toNumber(rent.pending),
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
      GROUP BY rent_schedule_id
    )
    SELECT
      rent_schedules.id AS rent_id,
      properties.name AS property_name,
      units.name AS unit_name,
      rent_schedules.month,
      rent_schedules.year,
      rent_schedules.amount,
      rent_schedules.due_date,
      rent_schedules.status,
      COALESCE(payment_totals.paid, 0) AS paid,
      GREATEST(rent_schedules.amount - COALESCE(payment_totals.paid, 0), 0) AS pending,
      CASE
        WHEN COALESCE(payment_totals.paid, 0) >= rent_schedules.amount THEN 'paid'
        WHEN COALESCE(payment_totals.paid, 0) > 0 THEN 'partial'
        ELSE 'pending'
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
    paid: toNumber(rent.paid),
    pending: toNumber(rent.pending),
    payments: paymentsByRent[rent.rent_id] || [],
  }));

  const summary = rent_history.reduce(
    (acc, rent) => ({
      total_rent: acc.total_rent + rent.amount,
      total_paid: acc.total_paid + rent.paid,
      total_pending: acc.total_pending + rent.pending,
    }),
    { total_rent: 0, total_paid: 0, total_pending: 0 }
  );

  return { summary, rent_history };
};

module.exports = { getOwnerDashboard, getTenantDashboard };
