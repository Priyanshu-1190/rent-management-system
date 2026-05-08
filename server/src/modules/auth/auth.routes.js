const express = require("express");
const router = express.Router();

const { register, login, deleteAccount } = require("./auth.controller");
const { validate } = require("../../middleware/validate.middleware");
const { protect } = require("../../middleware/auth.middleware");
const { registerSchema, loginSchema } = require("./auth.validation");

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.delete("/me", protect, deleteAccount);

module.exports = router;