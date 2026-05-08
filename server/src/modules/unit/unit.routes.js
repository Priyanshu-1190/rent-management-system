const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const { validate } = require("../../middleware/validate.middleware");
const { addUnit, removeUnit, listUnits } = require("./unit.controller");
const { createUnitSchema } = require("./unit.validation");

router.post("/:propertyId", protect, validate(createUnitSchema), addUnit);
router.get("/property/:propertyId", protect, listUnits);
router.delete("/:unitId", protect, removeUnit);

module.exports = router;
