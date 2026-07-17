const pool = require("./config/db");
const bcrypt = require("bcrypt");

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Get or create owner@example.com
    let ownerRes = await client.query("SELECT id FROM users WHERE email = $1", ["owner@example.com"]);
    let ownerId;
    if (ownerRes.rows.length === 0) {
      const hashedPw = await bcrypt.hash("Password123", 10);
      const insertOwner = await client.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id",
        ["Premium Owner", "owner@example.com", hashedPw, "owner"]
      );
      ownerId = insertOwner.rows[0].id;
      console.log("Created owner user.");
    } else {
      ownerId = ownerRes.rows[0].id;
      console.log("Found existing owner user.");
    }

    // Clean up existing data for this owner to allow clean re-runs of seed
    const propIdsRes = await client.query("SELECT id FROM properties WHERE owner_id = $1", [ownerId]);
    const propIds = propIdsRes.rows.map(r => r.id);
    if (propIds.length > 0) {
      await client.query("DELETE FROM properties WHERE id = ANY($1)", [propIds]);
      console.log("Cleaned up existing properties for owner.");
    }

    // Also clean up any tenants that were created by previous seed runs to avoid unique constraint violations
    await client.query("DELETE FROM users WHERE email IN ($1, $2, $3, $4)", [
      "alice@example.com",
      "bob@example.com",
      "charlie@example.com",
      "diana@example.com"
    ]);

    // 2. Create properties
    const prop1 = await client.query(
      "INSERT INTO properties (owner_id, name, address) VALUES ($1, $2, $3) RETURNING id",
      [ownerId, "Skyline Apartments", "1024 Blue Ridge Parkway, Sector 5"]
    );
    const prop1Id = prop1.rows[0].id;

    const prop2 = await client.query(
      "INSERT INTO properties (owner_id, name, address) VALUES ($1, $2, $3) RETURNING id",
      [ownerId, "Oakwood Residences", "404 Forest Hills Road, Sector 11"]
    );
    const prop2Id = prop2.rows[0].id;

    console.log("Created properties.");

    // 3. Create units
    const unit101 = await client.query(
      "INSERT INTO units (property_id, name, rent_amount, due_day, late_fee_percentage, grace_period_days) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [prop1Id, "101", 15000, 5, 5, 2]
    );
    const u101Id = unit101.rows[0].id;

    const unit102 = await client.query(
      "INSERT INTO units (property_id, name, rent_amount, due_day, late_fee_percentage, grace_period_days) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [prop1Id, "102", 18000, 10, 5, 2]
    );
    const u102Id = unit102.rows[0].id;

    const unitA1 = await client.query(
      "INSERT INTO units (property_id, name, rent_amount, due_day, late_fee_percentage, grace_period_days) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [prop2Id, "A-1", 25000, 1, 10, 3]
    );
    const uA1Id = unitA1.rows[0].id;

    const unitB2 = await client.query(
      "INSERT INTO units (property_id, name, rent_amount, due_day, late_fee_percentage, grace_period_days) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [prop2Id, "B-2", 30000, 5, 10, 3]
    );
    const uB2Id = unitB2.rows[0].id;

    console.log("Created units.");

    // 4. Create tenant users
    const hashedPw = await bcrypt.hash("Password123", 10);
    const t1 = await client.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Alice Green", "alice@example.com", hashedPw, "tenant"]
    );
    const t1Id = t1.rows[0].id;

    const t2 = await client.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Bob White", "bob@example.com", hashedPw, "tenant"]
    );
    const t2Id = t2.rows[0].id;

    const t3 = await client.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Charlie Black", "charlie@example.com", hashedPw, "tenant"]
    );
    const t3Id = t3.rows[0].id;

    const t4 = await client.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Diana Blue", "diana@example.com", hashedPw, "tenant"]
    );
    const t4Id = t4.rows[0].id;

    console.log("Created tenants.");

    // 5. Create tenancies
    const ten1 = await client.query(
      "INSERT INTO tenancies (tenant_id, unit_id, move_in_date, deposit, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [t1Id, u101Id, "2026-01-01", 30000, true]
    );
    const ten1Id = ten1.rows[0].id;

    const ten2 = await client.query(
      "INSERT INTO tenancies (tenant_id, unit_id, move_in_date, deposit, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [t2Id, u102Id, "2026-02-15", 36000, true]
    );
    const ten2Id = ten2.rows[0].id;

    const ten3 = await client.query(
      "INSERT INTO tenancies (tenant_id, unit_id, move_in_date, deposit, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [t3Id, uA1Id, "2026-03-01", 50000, true]
    );
    const ten3Id = ten3.rows[0].id;

    const ten4 = await client.query(
      "INSERT INTO tenancies (tenant_id, unit_id, move_in_date, deposit, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [t4Id, uB2Id, "2026-04-01", 60000, true]
    );
    const ten4Id = ten4.rows[0].id;

    console.log("Created tenancies.");

    // 6. Create Rent Schedules (Rent status rows)
    // June 2026 (Paid for all)
    // July 2026 (Some paid, some partial, some overdue)

    // June
    const rJune1 = await client.query(
      "INSERT INTO rent_schedules (tenancy_id, month, year, amount, due_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [ten1Id, 6, 2026, 15000, "2026-06-05", "paid"]
    );
    await client.query("INSERT INTO payments (rent_schedule_id, amount, payment_method, transaction_id, status) VALUES ($1, $2, $3, $4, $5)",
      [rJune1.rows[0].id, 15000, "UPI", "TXN12345", "success"]);

    const rJune2 = await client.query(
      "INSERT INTO rent_schedules (tenancy_id, month, year, amount, due_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [ten2Id, 6, 2026, 18000, "2026-06-10", "paid"]
    );
    await client.query("INSERT INTO payments (rent_schedule_id, amount, payment_method, transaction_id, status) VALUES ($1, $2, $3, $4, $5)",
      [rJune2.rows[0].id, 18000, "NetBanking", "TXN12346", "success"]);

    const rJune3 = await client.query(
      "INSERT INTO rent_schedules (tenancy_id, month, year, amount, due_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [ten3Id, 6, 2026, 25000, "2026-06-01", "paid"]
    );
    await client.query("INSERT INTO payments (rent_schedule_id, amount, payment_method, transaction_id, status) VALUES ($1, $2, $3, $4, $5)",
      [rJune3.rows[0].id, 25000, "Cash", "TXN12347", "success"]);

    const rJune4 = await client.query(
      "INSERT INTO rent_schedules (tenancy_id, month, year, amount, due_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [ten4Id, 6, 2026, 30000, "2026-06-05", "paid"]
    );
    await client.query("INSERT INTO payments (rent_schedule_id, amount, payment_method, transaction_id, status) VALUES ($1, $2, $3, $4, $5)",
      [rJune4.rows[0].id, 30000, "UPI", "TXN12348", "success"]);

    // July (Current date is July 17, 2026)
    // Alice paid
    const rJuly1 = await client.query(
      "INSERT INTO rent_schedules (tenancy_id, month, year, amount, due_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [ten1Id, 7, 2026, 15000, "2026-07-05", "paid"]
    );
    await client.query("INSERT INTO payments (rent_schedule_id, amount, payment_method, transaction_id, status) VALUES ($1, $2, $3, $4, $5)",
      [rJuly1.rows[0].id, 15000, "UPI", "TXN12349", "success"]);

    // Bob partial
    const rJuly2 = await client.query(
      "INSERT INTO rent_schedules (tenancy_id, month, year, amount, due_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [ten2Id, 7, 2026, 18000, "2026-07-10", "partial"]
    );
    await client.query("INSERT INTO payments (rent_schedule_id, amount, payment_method, transaction_id, status) VALUES ($1, $2, $3, $4, $5)",
      [rJuly2.rows[0].id, 10000, "UPI", "TXN12350", "success"]);

    // Charlie unpaid (overdue)
    const rJuly3 = await client.query(
      "INSERT INTO rent_schedules (tenancy_id, month, year, amount, due_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [ten3Id, 7, 2026, 25000, "2026-07-01", "pending"]
    );

    // Diana unpaid (overdue)
    const rJuly4 = await client.query(
      "INSERT INTO rent_schedules (tenancy_id, month, year, amount, due_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [ten4Id, 7, 2026, 30000, "2026-07-05", "pending"]
    );

    console.log("Created rent schedules and payments.");

    await client.query("COMMIT");
    console.log("Seeding complete successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during seeding:", error);
  } finally {
    client.release();
  }
}

seed().then(() => process.exit(0));
