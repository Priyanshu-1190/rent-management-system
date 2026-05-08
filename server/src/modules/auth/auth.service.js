const pool = require("../../config/db");
const bcrypt = require("bcrypt");

const registerUser = async ({ name, email, password, role }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role`,
    [name, email, hashedPassword, role]
  );

  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0];
};

const deleteUserById = async (userId) => {
  await pool.query("DELETE FROM users WHERE id = $1", [userId]);
};

module.exports = { registerUser, findUserByEmail, deleteUserById };