const express = require("express");
const router = express.Router();

const { register, login } = require("./auth.controller");
const { validate } = require("../../middleware/validate.middleware");
const { registerSchema, loginSchema } = require("./auth.validation");

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

module.exports = router;