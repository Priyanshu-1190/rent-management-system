const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const { validate } = require("../../middleware/validate.middleware");
const { createRent, payRent } = require("./rent.controller");
const { generateRentSchema, payRentSchema } = require("./rent.validation");

router.post("/generate", protect, validate(generateRentSchema), createRent);
router.post("/pay/:id", protect, validate(payRentSchema), payRent);

module.exports = router;