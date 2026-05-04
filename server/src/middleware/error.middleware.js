const { ZodError } = require("zod");

/**
 * Centralized error handling middleware.
 * Must be registered AFTER all routes in Express.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
  }

  // PostgreSQL unique violation
  if (err.code === "23505") {
    return res.status(409).json({
      error: "Duplicate entry. This record already exists.",
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === "23503") {
    return res.status(400).json({
      error: "Referenced record does not exist.",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired" });
  }

  // Default to 500
  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    error: err.message || "Internal Server Error",
  });
};

module.exports = { errorHandler };
