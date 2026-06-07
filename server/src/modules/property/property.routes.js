const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const { validate } = require("../../middleware/validate.middleware");
const { addProperty, editProperty, listProperties, removeProperty, updateLeaseAgreement } = require("./property.controller");
const { createPropertySchema, leaseAgreementSchema } = require("./property.validation");

router.post("/", protect, validate(createPropertySchema), addProperty);
router.get("/", protect, listProperties);
router.put("/:id", protect, validate(createPropertySchema), editProperty);
router.put("/:id/lease-agreement", protect, validate(leaseAgreementSchema), updateLeaseAgreement);
router.delete("/:id", protect, removeProperty);

module.exports = router;

