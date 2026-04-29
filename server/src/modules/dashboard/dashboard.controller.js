const { getOwnerDashboard, getTenantDashboard } = require("./dashboard.service");

const ownerDashboard = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Access denied" });
    }

    const data = await getOwnerDashboard(req.user.id);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const tenantDashboard = async (req, res) => {
  try {
    if (req.user.role !== "tenant") {
      return res.status(403).json({ error: "Access denied" });
    }

    const data = await getTenantDashboard(req.user.id);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { ownerDashboard, tenantDashboard };
