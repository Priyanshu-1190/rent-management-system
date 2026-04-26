const { Pool, types } = require("pg");
require("dotenv").config();

// Keep SQL DATE columns as YYYY-MM-DD strings so tenancy dates do not shift by timezone.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = pool;
