const pool = require("../../config/db");

const createProperty = async (ownerId, data) => {
  const result = await pool.query(
    `INSERT INTO properties (owner_id, name, address, lease_agreement)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [ownerId, data.name, data.address, data.lease_agreement || null]
  );

  return result.rows[0];
};

const getOwnerProperties = async (ownerId) => {
  const result = await pool.query(
    `SELECT p.*, COALESCE(
       json_agg(
         json_build_object('id', pi.id, 'image_path', pi.image_path)
       ) FILTER (WHERE pi.id IS NOT NULL), '[]'
     ) as images
     FROM properties p
     LEFT JOIN property_images pi ON p.id = pi.property_id
     WHERE p.owner_id = $1
     GROUP BY p.id
     ORDER BY p.created_at DESC, p.id DESC`,
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

const addPropertyImage = async (propertyId, imagePath) => {
  const result = await pool.query(
    `INSERT INTO property_images (property_id, image_path)
     VALUES ($1, $2)
     RETURNING *`,
    [propertyId, imagePath]
  );
  return result.rows[0];
};

const deletePropertyImage = async (ownerId, imageId) => {
  const result = await pool.query(
    `DELETE FROM property_images
     USING properties
     WHERE property_images.id = $1 
       AND property_images.property_id = properties.id 
       AND properties.owner_id = $2
     RETURNING property_images.*`,
    [imageId, ownerId]
  );
  return result.rows[0];
};

const getPropertyImages = async (propertyId) => {
  const result = await pool.query(
    `SELECT * FROM property_images WHERE property_id = $1 ORDER BY id ASC`,
    [propertyId]
  );
  return result.rows;
};

module.exports = {
  createProperty,
  getOwnerProperties,
  deleteOwnerProperty,
  updateOwnerProperty,
  updatePropertyLeaseAgreement,
  addPropertyImage,
  deletePropertyImage,
  getPropertyImages
};


