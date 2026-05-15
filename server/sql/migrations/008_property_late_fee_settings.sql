-- Migration: Add late fee settings to units
-- Date: 2026-05-14
-- Description: Allows owners to define grace period and late fee percentage per unit

ALTER TABLE units
ADD COLUMN IF NOT EXISTS late_fee_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS grace_period_days INT DEFAULT 0;
