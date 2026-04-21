const express = require("express");
const pool = require("../config/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (error) {
    console.error("Database connection error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
