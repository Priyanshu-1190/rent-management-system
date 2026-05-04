const { z } = require("zod");

const createUnitSchema = z.object({
  name: z.string().min(1, "Unit name is required"),
  rent_amount: z.coerce.number().positive("Rent amount must be greater than 0"),
  due_day: z.coerce
    .number()
    .int("Due day must be a whole number")
    .min(1, "Due day must be between 1 and 31")
    .max(31, "Due day must be between 1 and 31"),
});

module.exports = { createUnitSchema };
