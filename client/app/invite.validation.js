const { z } = require("zod");

const sendInviteSchema = z.object({
  tenant_email: z
    .string({ required_error: "Tenant email is required" })
    .trim()
    .min(1, "Tenant email is required")
    .email("Invalid email format"),
  unit_id: z.coerce.number().int().positive("Valid unit_id is required"),
  deposit: z.coerce.number().min(0).default(0),
  move_in_date: z
    .string({ required_error: "Move-in date is required" })
    .trim()
    .min(1, "Move-in date is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid move-in date format",
    }),
  message: z.string().trim().optional().nullable(),
});

module.exports = { sendInviteSchema };