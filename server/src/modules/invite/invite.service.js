const pool = require("../../config/db");

/**
 * Create a new invite from an owner to a tenant email for a specific unit.
 */
const createInvite = async ({ owner_id, tenant_email, unit_id, deposit, move_in_date, message }) => {
  const result = await pool.query(
    `INSERT INTO invites (owner_id, tenant_email, unit_id, deposit, move_in_date, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [owner_id, tenant_email, unit_id, deposit || 0, move_in_date || null, message || null]
  );
  return result.rows[0];
};

/**
 * List all invites sent by a specific owner.
 */
const getInvitesByOwner = async (ownerId) => {
  const result = await pool.query(
    `SELECT i.*, u.name AS unit_name, p.name AS property_name
     FROM invites i
     INNER JOIN units u ON u.id = i.unit_id
     INNER JOIN properties p ON p.id = u.property_id
     WHERE i.owner_id = $1
     ORDER BY i.created_at DESC`,
    [ownerId]
  );
  return result.rows;
};

/**
 * List all pending invites for a tenant (matched by email).
 */
const getInvitesForTenant = async (tenantEmail) => {
  const result = await pool.query(
    `SELECT i.id, i.unit_id, i.deposit, i.move_in_date, i.message, i.status, i.created_at,
            u.name AS unit_name, u.rent_amount,
            p.name AS property_name, p.address AS property_address,
            owner.name AS owner_name, owner.email AS owner_email
     FROM invites i
     INNER JOIN units u ON u.id = i.unit_id
     INNER JOIN properties p ON p.id = u.property_id
     INNER JOIN users owner ON owner.id = i.owner_id
     WHERE LOWER(i.tenant_email) = LOWER($1)
     ORDER BY i.created_at DESC`,
    [tenantEmail]
  );
  return result.rows;
};

/**
 * Get a single invite by ID.
 */
const getInviteById = async (inviteId) => {
  const result = await pool.query(
    `SELECT i.*, u.name AS unit_name, p.name AS property_name, p.id AS property_id
     FROM invites i
     INNER JOIN units u ON u.id = i.unit_id
     INNER JOIN properties p ON p.id = u.property_id
     WHERE i.id = $1`,
    [inviteId]
  );
  return result.rows[0];
};

/**
 * Respond to an invite (accept or decline).
 */
const respondToInvite = async (inviteId, status) => {
  const result = await pool.query(
    `UPDATE invites
     SET status = $2, responded_at = NOW()
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [inviteId, status]
  );
  return result.rows[0];
};

/**
 * Check if a unit already has an active tenancy.
 */
const unitHasActiveTenancy = async (unitId) => {
  const result = await pool.query(
    `SELECT id FROM tenancies WHERE unit_id = $1 AND is_active = TRUE LIMIT 1`,
    [unitId]
  );
  return Boolean(result.rows[0]);
};

/**
 * Create a tenancy from an accepted invite (transactional).
 */
const acceptInviteAndCreateTenancy = async (invite, tenantId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Mark invite as accepted
    await client.query(
      `UPDATE invites SET status = 'accepted', responded_at = NOW() WHERE id = $1`,
      [invite.id]
    );

    // Create the tenancy
    const tenancyResult = await client.query(
      `INSERT INTO tenancies (tenant_id, unit_id, move_in_date, deposit)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [tenantId, invite.unit_id, invite.move_in_date, invite.deposit]
    );

    await client.query("COMMIT");
    return tenancyResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Cancel (delete) a pending invite — owner only.
 */
const cancelInvite = async (inviteId, ownerId) => {
  const result = await pool.query(
    `DELETE FROM invites
     WHERE id = $1 AND owner_id = $2 AND status = 'pending'
     RETURNING id`,
    [inviteId, ownerId]
  );
  return result.rows[0];
};

/**
 * Get available (unoccupied) units for an owner to invite tenants to.
 */
const getAvailableUnitsForOwner = async (ownerId) => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.rent_amount, p.name AS property_name, p.id AS property_id
     FROM units u
     INNER JOIN properties p ON p.id = u.property_id
     WHERE p.owner_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM tenancies t WHERE t.unit_id = u.id AND t.is_active = TRUE
       )
       AND NOT EXISTS (
         SELECT 1 FROM invites i WHERE i.unit_id = u.id AND i.status = 'pending'
       )
     ORDER BY p.name, u.name`,
    [ownerId]
  );
  return result.rows;
};

module.exports = {
  createInvite,
  getInvitesByOwner,
  getInvitesForTenant,
  getInviteById,
  respondToInvite,
  unitHasActiveTenancy,
  acceptInviteAndCreateTenancy,
  cancelInvite,
  getAvailableUnitsForOwner,
};
