const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const { validate } = require("../../middleware/validate.middleware");
const { createTenancy } = require("./tenancy.controller");
const { createTenancySchema } = require("./tenancy.validation");

router.post("/", protect, validate(createTenancySchema), createTenancy);

module.exports = router;
