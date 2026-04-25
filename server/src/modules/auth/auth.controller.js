const bcrypt = require("bcrypt");
const { generateToken } = require("../../utils/jwt");
const { registerUser, findUserByEmail } = require("./auth.service");
const { validateRegister, validateLogin } = require("./auth.validation");

const register = async (req, res) => {
  try {
    const error = validateRegister(req.body);
    if (error) {
      return res.status(400).json({ error });
    }

    const user = await registerUser(req.body);
    return res.status(201).json(user);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const error = validateLogin(req.body);
    if (error) {
      return res.status(400).json({ error });
    }

    const { email, password } = req.body;
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
};

module.exports = { register, login };
