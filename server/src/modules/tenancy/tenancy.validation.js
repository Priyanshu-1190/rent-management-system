const { z } = require("zod");

const createTenancySchema = z.object({
  tenant_id: z.coerce.number().int().positive("Valid tenant_id is required"),
  unit_id: z.coerce.number().int().positive("Valid unit_id is required"),
  move_in_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "move_in_date must be in YYYY-MM-DD format"),
  deposit: z.coerce.number().min(0, "Deposit cannot be negative").optional(),
});

module.exports = { createTenancySchema };
