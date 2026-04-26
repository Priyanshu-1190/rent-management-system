const {
  getOwnerUnitDetails,
  findTenantById,
  hasActiveTenancy,
  assignTenant,
} = require("./tenancy.service");

const createTenancy = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const tenantId = Number(req.body.tenant_id);
    const unitId = Number(req.body.unit_id);
    const deposit = req.body.deposit === undefined ? null : Number(req.body.deposit);
    const moveInDate = req.body.move_in_date;

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      return res.status(400).json({ error: "Valid tenant_id is required" });
    }

    if (!Number.isInteger(unitId) || unitId <= 0) {
      return res.status(400).json({ error: "Valid unit_id is required" });
    }

    if (!moveInDate) {
      return res.status(400).json({ error: "move_in_date is required" });
    }

    if (deposit !== null && Number.isNaN(deposit)) {
      return res.status(400).json({ error: "Deposit must be a number" });
    }

    const ownerUnit = await getOwnerUnitDetails(req.user.id, unitId);
    if (!ownerUnit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    const tenant = await findTenantById(tenantId);
    if (!tenant || tenant.role !== "tenant") {
      return res.status(400).json({ error: "Tenant user not found" });
    }

    if (await hasActiveTenancy(unitId)) {
      return res.status(409).json({ error: "Unit already has an active tenant" });
    }

    const tenancy = await assignTenant({
      tenant_id: tenantId,
      unit_id: unitId,
      move_in_date: moveInDate,
      deposit,
    });

    return res.status(201).json(tenancy);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Unit already has an active tenant" });
    }

    return res.status(500).json({ error: error.message });
  }
};

module.exports = { createTenancy };
