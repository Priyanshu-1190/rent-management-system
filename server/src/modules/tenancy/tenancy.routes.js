const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const { createTenancy } = require("./tenancy.controller");

router.post("/", protect, createTenancy);

module.exports = router;
