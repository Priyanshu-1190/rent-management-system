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

module.exports = { createProperty, getOwnerProperties };
