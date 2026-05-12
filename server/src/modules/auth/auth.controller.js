const bcrypt = require("bcrypt");
const { generateToken } = require("../../utils/jwt");
const { registerUser, findUserByEmail, deleteUserById } = require("./auth.service");

const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    return res.status(201).json(user);
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
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
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    });
  } catch (err) {
    return next(err);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    await deleteUserById(req.user.id);
    return res.json({ message: "Account deleted" });
  } catch (err) {
    return next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
  } catch (err) {
    return next(err);
  }
};

module.exports = { register, login, deleteAccount, getMe };
