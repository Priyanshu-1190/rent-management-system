CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    owner_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS units (
    id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(50),
    rent_amount NUMERIC NOT NULL,
    due_day INT CHECK (due_day BETWEEN 1 AND 31),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenancies (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES users(id) ON DELETE CASCADE,
    unit_id INT REFERENCES units(id) ON DELETE CASCADE,
    move_in_date DATE,
    deposit NUMERIC,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS tenancies_one_active_unit_idx
ON tenancies (unit_id)
WHERE is_active = TRUE;
