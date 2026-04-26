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

const createUnit = async (propertyId, data) => {
  const result = await pool.query(
    `INSERT INTO units (property_id, name, rent_amount, due_day)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [propertyId, data.name, data.rent_amount, data.due_day]
  );

  return result.rows[0];
};

module.exports = { getOwnerPropertyById, createUnit };
