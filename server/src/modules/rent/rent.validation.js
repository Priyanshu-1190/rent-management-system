const { z } = require("zod");

const generateRentSchema = z.object({
  tenancy_id: z.coerce.number().int().positive("Valid tenancy_id is required"),
  month: z.coerce
    .number()
    .int()
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),
  year: z.coerce
    .number()
    .int()
    .min(2000, "Year must be valid")
    .max(2100, "Year must be valid"),
});

const payRentSchema = z.object({
  amount: z.coerce.number().positive("Payment amount must be greater than 0"),
  method: z.string().min(1, "Payment method is required"),
  txn_id: z.string().optional(),
});

module.exports = { generateRentSchema, payRentSchema };
