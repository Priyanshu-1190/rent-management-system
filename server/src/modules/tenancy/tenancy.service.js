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

/**
 * Get all tenants for an owner with their status (active, past, invited)
 */
const getTenantsByOwner = async (ownerId) => {
  const result = await pool.query(
    `
    SELECT * FROM (
      SELECT
        'tenant' AS type,
        users.id AS tenant_id,
        users.name,
        users.email,
        properties.name AS property_name,
        units.name AS unit_name,
        tenancies.move_in_date,
        tenancies.move_out_date,
        CASE WHEN tenancies.is_active = TRUE THEN 'active' ELSE 'past' END AS status,
        tenancies.deposit,
        tenancies.id AS tenancy_id
      FROM tenancies
      INNER JOIN users ON users.id = tenancies.tenant_id
      INNER JOIN units ON units.id = tenancies.unit_id
      INNER JOIN properties ON properties.id = units.property_id
      WHERE properties.owner_id = $1
      
      UNION ALL
      
      SELECT
        'invited' AS type,
        NULL::integer AS tenant_id,
        NULL::character varying AS name,
        invites.tenant_email AS email,
        properties.name AS property_name,
        units.name AS unit_name,
        invites.move_in_date,
        NULL::date AS move_out_date,
        'invited' AS status,
        invites.deposit,
        invites.id AS tenancy_id
      FROM invites
      INNER JOIN units ON units.id = invites.unit_id
      INNER JOIN properties ON properties.id = units.property_id
      WHERE properties.owner_id = $1 AND invites.status = 'pending'
    ) AS combined_tenants
    ORDER BY 
      CASE status 
        WHEN 'active' THEN 1
        WHEN 'past' THEN 2
        WHEN 'invited' THEN 3
        ELSE 4
      END,
      COALESCE(move_in_date, CURRENT_DATE) DESC
    `,
    [ownerId]
  );
  
  return result.rows;
};

const terminateTenancy = async (ownerId, tenancyId) => {
  const result = await pool.query(
    `UPDATE tenancies
     SET is_active = FALSE, move_out_date = CURRENT_DATE
     FROM units u
     INNER JOIN properties p ON p.id = u.property_id
     WHERE tenancies.id = $1 AND tenancies.unit_id = u.id AND p.owner_id = $2
     RETURNING tenancies.*`,
    [tenancyId, ownerId]
  );
  return result.rows[0];
};

module.exports = { getOwnerUnitDetails, findTenantById, hasActiveTenancy, assignTenant, getTenantsByOwner, terminateTenancy };
