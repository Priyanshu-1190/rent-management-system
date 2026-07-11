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
const cache = require("../../utils/cache.service");

/**
 * POST /api/invites — Owner sends an invite to a tenant email.
 */
const sendInvite = async (req, res, next) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Only owners can send invites" });
    }

    // Check unit isn't already occupied
    if (await unitHasActiveTenancy(req.body.unit_id)) {
      return res.status(409).json({ error: "Unit already has an active tenant" });
    }

    const invite = await createInvite({
      owner_id: req.user.id,
      ...req.body,
      tenant_email: req.body.tenant_email.toLowerCase(),
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

    // Invalidate cache for available units for this owner
    const cacheKey = `available_units_owner_${invite.owner_id}`;
    cache.del(cacheKey);

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

    // Invalidate cache for available units for this owner
    const cacheKey = `available_units_owner_${req.user.id}`;
    cache.del(cacheKey);

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

    const cacheKey = `available_units_owner_${req.user.id}`;
    const cachedUnits = cache.get(cacheKey);

    if (cachedUnits) {
      return res.json(cachedUnits);
    }

    const units = await getAvailableUnitsForOwner(req.user.id);

    cache.set(cacheKey, units);

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
