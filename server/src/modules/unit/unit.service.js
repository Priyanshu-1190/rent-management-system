const pool = require("../../config/db");

const getOwnerPropertyById = async (ownerId, propertyId) => {
  const result = await pool.query(
    `SELECT *
     FROM properties
     WHERE id = $1 AND owner_id = $2`,
    [propertyId, ownerId]
  );

  return result.rows[0];
};

const getUnitByNameAndPropertyId = async (propertyId, name) => {
  const result = await pool.query(
    `SELECT *
     FROM units
     WHERE property_id = $1 AND LOWER(name) = LOWER($2)`,
    [propertyId, name]
  );
  return result.rows[0];
};

const createUnit = async (propertyId, data) => {
  const result = await pool.query(
    `INSERT INTO units (property_id, name, rent_amount, due_day, late_fee_percentage, grace_period_days, lease_agreement)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      propertyId,
      data.name,
      data.rent_amount,
      data.due_day,
      data.late_fee_percentage || 0,
      data.grace_period_days || 0,
      data.lease_agreement || null,
    ]
  );

  return result.rows[0];
};

const deleteOwnerUnit = async (ownerId, unitId) => {
  const result = await pool.query(
    `DELETE FROM units u
     USING properties p
     WHERE u.id = $1 AND u.property_id = p.id AND p.owner_id = $2
     RETURNING u.id`,
    [unitId, ownerId]
  );
  return result.rows[0];
};

const getUnitsByProperty = async (ownerId, propertyId) => {
  const result = await pool.query(
    `SELECT
      u.*,
      u.lease_agreement AS unit_lease_agreement,
      p.name AS property_name,
      p.lease_agreement AS property_lease_agreement,
      t.id AS tenancy_id,
      t.move_in_date,
      t.deposit,
      t.is_active,
      usr.id AS tenant_id,
      usr.name AS tenant_name,
      usr.email AS tenant_email
     FROM units u
     JOIN properties p ON p.id = u.property_id
     LEFT JOIN tenancies t ON t.unit_id = u.id AND t.is_active = TRUE
     LEFT JOIN users usr ON usr.id = t.tenant_id
     WHERE u.property_id = $1 AND p.owner_id = $2
     ORDER BY u.created_at DESC, u.id DESC`,
    [propertyId, ownerId]
  );
  return result.rows;
};

const getUnitDetails = async (ownerId, unitId) => {
  const result = await pool.query(
    `SELECT
      u.id AS unit_id,
      u.name AS unit_name,
      u.rent_amount,
      u.due_day,
      u.late_fee_percentage,
      u.grace_period_days,
      u.lease_agreement AS unit_lease_agreement,
      p.id AS property_id,
      p.name AS property_name,
      p.lease_agreement AS property_lease_agreement,
      t.id AS tenancy_id,
      t.move_in_date,
      t.deposit,
      t.is_active,
      usr.id AS tenant_id,
      usr.name AS tenant_name,
      usr.email AS tenant_email
    FROM units u
    JOIN properties p ON p.id = u.property_id
    LEFT JOIN tenancies t ON t.unit_id = u.id AND t.is_active = TRUE
    LEFT JOIN users usr ON usr.id = t.tenant_id
    WHERE u.id = $1 AND p.owner_id = $2`,
    [unitId, ownerId]
  );
  return result.rows[0];
};

const getUnitById = async (unitId) => {
  const result = await pool.query("SELECT * FROM units WHERE id = $1", [unitId]);
  return result.rows[0];
};

const updateOwnerUnit = async (ownerId, unitId, data) => {
  const result = await pool.query(
    `UPDATE units u
     SET name = $1, rent_amount = $2, due_day = $3, late_fee_percentage = $4, grace_period_days = $5
     FROM properties p
     WHERE u.id = $6 AND u.property_id = p.id AND p.owner_id = $7
     RETURNING u.*`,
    [
      data.name,
      data.rent_amount,
      data.due_day,
      data.late_fee_percentage || 0,
      data.grace_period_days || 0,
      unitId,
      ownerId,
    ]
  );
  return result.rows[0];
};

const updateUnitLeaseAgreement = async (ownerId, unitId, leaseAgreement) => {
  const result = await pool.query(
    `UPDATE units u
     SET lease_agreement = $1
     FROM properties p
     WHERE u.id = $2 AND u.property_id = p.id AND p.owner_id = $3
     RETURNING u.*`,
    [leaseAgreement, unitId, ownerId]
  );
  return result.rows[0];
};

module.exports = { getOwnerPropertyById, getUnitByNameAndPropertyId, createUnit, deleteOwnerUnit, getUnitsByProperty, updateOwnerUnit, getUnitById, getUnitDetails, updateUnitLeaseAgreement };

