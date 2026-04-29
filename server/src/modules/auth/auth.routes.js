const express = require("express");
const router = express.Router();

const { register, login } = require("./auth.controller");

router.post("/register", register);
router.post("/login", login);

module.exports = router;console.log("AUTH ROUTES FILE LOADED");