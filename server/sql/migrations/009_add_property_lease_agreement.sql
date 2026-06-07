-- Migration: Add lease agreement to properties
-- Date: 2026-06-07
-- Description: Adds a lease_agreement column to properties table

ALTER TABLE properties ADD COLUMN lease_agreement TEXT DEFAULT NULL;
