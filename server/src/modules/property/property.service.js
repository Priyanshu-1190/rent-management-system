const pool = require("../../config/db");

const createProperty = async (ownerId, data) => {
  const result = await pool.query(
    `INSERT INTO properties (owner_id, name, address)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [ownerId, data.name, data.address]
  );

  return result.rows[0];
};

const getOwnerProperties = async (ownerId) => {
  const result = await pool.query(
    `SELECT *
     FROM properties
     WHERE owner_id = $1
     ORDER BY created_at DESC, id DESC`,
    [ownerId]
  );

  return result.rows;
};

const deleteOwnerProperty = async (ownerId, propertyId) => {
  const result = await pool.query(
    `DELETE FROM properties WHERE id = $1 AND owner_id = $2 RETURNING id`,
    [propertyId, ownerId]
  );
  return result.rows[0];
};

const updateOwnerProperty = async (ownerId, propertyId, data) => {
  const result = await pool.query(
    `UPDATE properties
     SET name = $1, address = $2
     WHERE id = $3 AND owner_id = $4
     RETURNING *`,
    [data.name, data.address, propertyId, ownerId]
  );
  return result.rows[0];
};

const updatePropertyLeaseAgreement = async (ownerId, propertyId, leaseAgreement) => {
  const result = await pool.query(
    `UPDATE properties
     SET lease_agreement = $1
     WHERE id = $2 AND owner_id = $3
     RETURNING *`,
    [leaseAgreement, propertyId, ownerId]
  );
  return result.rows[0];
};

module.exports = { createProperty, getOwnerProperties, deleteOwnerProperty, updateOwnerProperty, updatePropertyLeaseAgreement };

