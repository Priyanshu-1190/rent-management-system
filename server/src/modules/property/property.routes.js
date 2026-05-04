const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const { validate } = require("../../middleware/validate.middleware");
const { addProperty, listProperties } = require("./property.controller");
const { createPropertySchema } = require("./property.validation");

router.post("/", protect, validate(createPropertySchema), addProperty);
router.get("/", protect, listProperties);

module.exports = router;
