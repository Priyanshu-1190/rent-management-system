const { z } = require("zod");

const createUnitSchema = z.object({
  name: z.string().min(1, "Unit name is required"),
  rent_amount: z.coerce.number().positive("Rent amount must be greater than 0"),
  due_day: z.coerce
    .number()
    .int("Due day must be a whole number")
    .min(1, "Due day must be between 1 and 31")
    .max(31, "Due day must be between 1 and 31")
    .optional()
    .default(1),
  late_fee_percentage: z.coerce
    .number()
    .min(0, "Late fee percentage cannot be negative")
    .max(100, "Late fee percentage cannot exceed 100")
    .optional()
    .default(0),
  grace_period_days: z.coerce
    .number()
    .int("Grace period must be a whole number")
    .min(0, "Grace period cannot be negative")
    .optional()
    .default(0),
});

module.exports = { createUnitSchema };
