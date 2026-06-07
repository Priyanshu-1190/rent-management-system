const { z } = require("zod");

const createPropertySchema = z.object({
  name: z.string().min(2, "Property name must be at least 2 characters"),
  address: z.string().optional(),
});

const leaseAgreementSchema = z.object({
  lease_agreement: z.string().nullable().optional(),
});

module.exports = { createPropertySchema, leaseAgreementSchema };

