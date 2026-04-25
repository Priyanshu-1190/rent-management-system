const pool = require("../../config/db");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

const registerUser = async ({ name, email, password, role }) => {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, role]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      throw { status: 409, message: "Email already registered" };
    }
    throw error;
  }
};

const findUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
};

module.exports = { registerUser, findUserByEmail };
