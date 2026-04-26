const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const { addUnit } = require("./unit.controller");

router.post("/:propertyId", protect, addUnit);

module.exports = router;
