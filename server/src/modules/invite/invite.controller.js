const {
  createInvite,
  getInvitesByOwner,
  getInvitesForTenant,
  getInviteById,
  unitHasActiveTenancy,
  acceptInviteAndCreateTenancy,
  respondToInvite,
  cancelInvite,
  getAvailableUnitsForOwner,
} = require("./invite.service");

/**
 * POST /api/invites — Owner sends an invite to a tenant email.
 */
const sendInvite = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Only owners can send invites" });
    }

    const { tenant_email, unit_id, deposit, move_in_date, message } = req.body;

    if (!tenant_email || !String(tenant_email).trim()) {
      return res.status(400).json({ error: "Tenant email is required" });
    }

    if (!unit_id || !Number.isInteger(Number(unit_id)) || Number(unit_id) <= 0) {
      return res.status(400).json({ error: "Valid unit_id is required" });
    }

    if (!move_in_date || !String(move_in_date).trim()) {
      return res.status(400).json({ error: "Move-in date is required" });
    }

    // Check unit isn't already occupied
    if (await unitHasActiveTenancy(Number(unit_id))) {
      return res.status(409).json({ error: "Unit already has an active tenant" });
    }

    const invite = await createInvite({
      owner_id: req.user.id,
      tenant_email: String(tenant_email).trim().toLowerCase(),
      unit_id: Number(unit_id),
      deposit: deposit ? Number(deposit) : 0,
      move_in_date: String(move_in_date).trim(),
      message: message || null,
    });

    return res.status(201).json(invite);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "A pending invite already exists for this unit" });
    }
    return next(error);
  }
};

/**
 * GET /api/invites/sent — Owner views all sent invites.
 */
const listSentInvites = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const invites = await getInvitesByOwner(req.user.id);
    return res.json(invites);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/invites/received — Tenant views their invites.
 */
const listReceivedInvites = async (req, res, next) => {
  try {
    if (req.user.role !== "tenant") {
      return res.status(403).json({ error: "Access denied" });
    }

    const invites = await getInvitesForTenant(req.user.email);
    return res.json(invites);
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/invites/:id/accept — Tenant accepts an invite.
 */
const acceptInvite = async (req, res, next) => {
  try {
    if (req.user.role !== "tenant") {
      return res.status(403).json({ error: "Only tenants can accept invites" });
    }

    const inviteId = Number(req.params.id);
    const invite = await getInviteById(inviteId);

    if (!invite) {
      return res.status(404).json({ error: "Invite not found" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ error: `Invite has already been ${invite.status}` });
    }

    // Verify the invite is for this tenant
    if (invite.tenant_email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ error: "This invite is not for you" });
    }

    // Check unit isn't already occupied
    if (await unitHasActiveTenancy(invite.unit_id)) {
      // Auto-expire the invite
      await respondToInvite(inviteId, "expired");
      return res.status(409).json({ error: "Unit is no longer available" });
    }

    const tenancy = await acceptInviteAndCreateTenancy(invite, req.user.id);
    return res.json({ message: "Invite accepted, tenancy created", tenancy });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Unit already has an active tenant" });
    }
    return next(error);
  }
};

/**
 * POST /api/invites/:id/decline — Tenant declines an invite.
 */
const declineInvite = async (req, res, next) => {
  try {
    if (req.user.role !== "tenant") {
      return res.status(403).json({ error: "Only tenants can decline invites" });
    }

    const inviteId = Number(req.params.id);
    const invite = await getInviteById(inviteId);

    if (!invite) {
      return res.status(404).json({ error: "Invite not found" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ error: `Invite has already been ${invite.status}` });
    }

    if (invite.tenant_email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ error: "This invite is not for you" });
    }

    const updated = await respondToInvite(inviteId, "declined");
    return res.json({ message: "Invite declined", invite: updated });
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/invites/:id — Owner cancels a pending invite.
 */
const removeInvite = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Only owners can cancel invites" });
    }

    const inviteId = Number(req.params.id);
    const deleted = await cancelInvite(inviteId, req.user.id);

    if (!deleted) {
      return res.status(404).json({ error: "Pending invite not found" });
    }

    return res.json({ message: "Invite cancelled" });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/invites/available-units — Owner gets units available for inviting.
 */
const listAvailableUnits = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const units = await getAvailableUnitsForOwner(req.user.id);
    return res.json(units);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  sendInvite,
  listSentInvites,
  listReceivedInvites,
  acceptInvite,
  declineInvite,
  removeInvite,
  listAvailableUnits,
};
