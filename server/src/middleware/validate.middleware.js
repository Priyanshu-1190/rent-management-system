const { ZodError } = require("zod");

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * Returns 400 with field-level error details on validation failure.
 *
 * Usage: router.post("/", validate(mySchema), controller);
 */
const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed; // Replace with parsed (coerced/transformed) data
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    next(error);
  }
};

module.exports = { validate };

