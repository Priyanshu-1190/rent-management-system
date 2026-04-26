const pool = require("../../config/db");

const getOwnerUnitDetails = async (ownerId, unitId) => {
  const result = await pool.query(
    `SELECT
        units.id AS unit_id,
        properties.id AS property_id,
        properties.owner_id
     FROM units
     INNER JOIN properties ON properties.id = units.property_id
     WHERE units.id = $1 AND properties.owner_id = $2`,
    [unitId, ownerId]
  );

  return result.rows[0];
};

const findTenantById = async (tenantId) => {
  const result = await pool.query(
    `SELECT id, role
     FROM users
     WHERE id = $1`,
    [tenantId]
  );

  return result.rows[0];
};

const hasActiveTenancy = async (unitId) => {
  const result = await pool.query(
    `SELECT id
     FROM tenancies
     WHERE unit_id = $1 AND is_active = TRUE
     LIMIT 1`,
    [unitId]
  );

  return Boolean(result.rows[0]);
};

const assignTenant = async (data) => {
  const result = await pool.query(
    `INSERT INTO tenancies (tenant_id, unit_id, move_in_date, deposit)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.tenant_id, data.unit_id, data.move_in_date, data.deposit]
  );

  return result.rows[0];
};

module.exports = { getOwnerUnitDetails, findTenantById, hasActiveTenancy, assignTenant };
