-- Invites table: property owners invite tenants to specific units
CREATE TABLE IF NOT EXISTS invites (
    id SERIAL PRIMARY KEY,
    owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_email VARCHAR(100) NOT NULL,
    unit_id INT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    deposit NUMERIC DEFAULT 0,
    move_in_date DATE,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP
);

-- Only one pending invite per unit (avoids double-inviting)
CREATE UNIQUE INDEX IF NOT EXISTS invites_one_pending_unit_idx
ON invites (unit_id)
WHERE status = 'pending';
