const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const { validate } = require("../../middleware/validate.middleware");
const { addUnit, editUnit, removeUnit, listUnits, getUnitDetails } = require("./unit.controller");
const { createUnitSchema } = require("./unit.validation");

router.post("/:propertyId", protect, validate(createUnitSchema), addUnit);
router.get("/property/:propertyId", protect, listUnits);
router.get("/:unitId/details", protect, getUnitDetails);
router.put("/:unitId", protect, validate(createUnitSchema), editUnit);
router.delete("/:unitId", protect, removeUnit);

module.exports = router;
