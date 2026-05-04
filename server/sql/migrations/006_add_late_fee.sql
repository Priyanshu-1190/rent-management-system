-- Migration: Add late_fee column to rent_schedules
-- Date: 2026-04-30
-- Description: Supports automatic late fee calculation for overdue rent

ALTER TABLE rent_schedules
ADD COLUMN IF NOT EXISTS late_fee NUMERIC DEFAULT 0;
