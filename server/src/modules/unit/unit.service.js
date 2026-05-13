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
    `INSERT INTO units (property_id, name, rent_amount, due_day)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [propertyId, data.name, data.rent_amount, data.due_day]
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
    `SELECT u.* FROM units u
     JOIN properties p ON p.id = u.property_id
     WHERE u.property_id = $1 AND p.owner_id = $2
     ORDER BY u.created_at DESC, u.id DESC`,
    [propertyId, ownerId]
  );
  return result.rows;
};

module.exports = { getOwnerPropertyById, getUnitByNameAndPropertyId, createUnit, deleteOwnerUnit, getUnitsByProperty };
