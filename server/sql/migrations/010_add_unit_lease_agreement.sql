-- Migration: Add lease agreement to units
-- Date: 2026-06-08
-- Description: Adds a lease_agreement column to units table to allow unit-specific terms

ALTER TABLE units ADD COLUMN lease_agreement TEXT DEFAULT NULL;
