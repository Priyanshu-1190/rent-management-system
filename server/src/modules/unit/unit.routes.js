const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const { validate } = require("../../middleware/validate.middleware");
const { addUnit } = require("./unit.controller");
const { createUnitSchema } = require("./unit.validation");

router.post("/:propertyId", protect, validate(createUnitSchema), addUnit);

module.exports = router;
