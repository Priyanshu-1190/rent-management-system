const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  // Try retrieving token from HttpOnly cookie first, falling back to Authorization header
  const token =
    req.cookies?.token ||
    req.cookies?.auth_token ||
    req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = { protect };