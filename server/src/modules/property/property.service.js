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

module.exports = { createProperty, getOwnerProperties, deleteOwnerProperty };
