const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const { ownerDashboard, tenantDashboard } = require("./dashboard.controller");

router.get("/owner", protect, ownerDashboard);
router.get("/tenant", protect, tenantDashboard);

module.exports = router;
