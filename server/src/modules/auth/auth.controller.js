const bcrypt = require("bcrypt");
const { generateToken } = require("../../utils/jwt");
const { registerUser, findUserByEmail, deleteUserById } = require("./auth.service");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

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
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user);

    // Set HttpOnly SameSite cookie for XSS defense
    res.cookie("token", token, COOKIE_OPTIONS);
    res.cookie("auth_token", token, COOKIE_OPTIONS);

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    });
  } catch (err) {
    return next(err);
  }
};

const logout = async (req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.clearCookie("auth_token", COOKIE_OPTIONS);
  return res.json({ message: "Logged out successfully" });
};

const deleteAccount = async (req, res, next) => {
  try {
    await deleteUserById(req.user.id);
    res.clearCookie("token", COOKIE_OPTIONS);
    res.clearCookie("auth_token", COOKIE_OPTIONS);
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

module.exports = { register, login, logout, deleteAccount, getMe };
