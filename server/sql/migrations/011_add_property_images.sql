-- Migration: Add property images table
-- Date: 2026-06-17
-- Description: Creates the property_images table to store uploaded image metadata for properties

CREATE TABLE IF NOT EXISTS property_images (
    id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(id) ON DELETE CASCADE,
    image_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
