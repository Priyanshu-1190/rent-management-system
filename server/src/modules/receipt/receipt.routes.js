const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const { downloadReceipt } = require("./receipt.controller");

router.get("/:id", protect, downloadReceipt);

module.exports = router;
