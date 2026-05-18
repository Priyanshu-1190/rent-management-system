-- Migration: Add late fee settings to units
-- Date: 2026-05-14
-- Description: Allows owners to define grace period and late fee percentage per unit

IF COL_LENGTH('units', 'late_fee_percentage') IS NULL
BEGIN
	ALTER TABLE units
	ADD late_fee_percentage NUMERIC DEFAULT 0;
END;

IF COL_LENGTH('units', 'grace_period_days') IS NULL
BEGIN
	ALTER TABLE units
	ADD grace_period_days INT DEFAULT 0;
END;
