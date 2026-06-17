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

// Auto-initialize property_images table if it does not exist
pool.query(`
  CREATE TABLE IF NOT EXISTS property_images (
    id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(id) ON DELETE CASCADE,
    image_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch((err) => {
  console.error("[DB INIT ERROR] Failed to initialize property_images table:", err);
});

module.exports = pool;

