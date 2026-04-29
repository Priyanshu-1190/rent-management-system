const router = require("express").Router();
const { protect } = require("../../middleware/auth.middleware");
const { createRent, payRent } = require("./rent.controller");

router.post("/generate", protect, createRent);
router.post("/pay/:id", protect, payRent);

module.exports = router;console.log("Rent routes loaded");