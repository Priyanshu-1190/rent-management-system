const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const { addProperty, listProperties } = require("./property.controller");

router.post("/", protect, addProperty);
router.get("/", protect, listProperties);

module.exports = router;
