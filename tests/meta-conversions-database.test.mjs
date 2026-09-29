import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const migration = readFileSync('supabase/migration-meta-conversions.sql', 'utf8');

async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create table orders(order_number text primary key, payment_status text, payment_captured_at timestamptz);
    create table checkout_sessions(
      id uuid primary key default gen_random_uuid(), session_key text unique,
      order_number text, updated_at timestamptz default now()
    );
  `);
  await db.exec(migration);
  return db;
}

test('Meta migration replays, attribution columns exist and outbox remains service-role only', async () => {
  const db = await database();
  try {
    await db.exec(migration);
    const columns = await db.query(`select column_name from information_schema.columns
      where table_name='checkout_sessions' and column_name in
      ('landing_url','fbclid','fbp','fbc','visitor_id','client_ip_address','client_user_agent')`);
    assert.equal(columns.rows.length, 7);
    const permissions = await db.query("select has_table_privilege('anon','meta_conversion_outbox','select') as readable,has_function_privilege('anon','claim_meta_conversion(uuid,integer)','execute') as callable");
    assert.deepEqual(permissions.rows, [{ readable: false, callable: false }]);
  } finally { await db.close(); }
});

test('outbox event ID is unique and expired leases retry the same logical Purchase', async () => {
  const db = await database();
  try {
    await db.exec("insert into orders values ('HOE-TEST','paid',now())");
    await db.exec("insert into meta_conversion_outbox(event_id,event_name,order_number,event_time) values ('HOE-TEST','Purchase','HOE-TEST',now())");
    await assert.rejects(db.exec("insert into meta_conversion_outbox(event_id,event_name,order_number,event_time) values ('HOE-TEST','Purchase','HOE-TEST',now())"));

    const firstToken = randomUUID();
    const first = await db.query('select * from claim_meta_conversion($1,$2)', [firstToken, 30]);
    assert.equal(first.rows.length, 1);
    assert.equal(first.rows[0].event_id, 'HOE-TEST');
    assert.equal(first.rows[0].attempts, 1);
    assert.equal((await db.query('select * from claim_meta_conversion($1,$2)', [randomUUID(), 30])).rows.length, 0);

    await db.exec("update meta_conversion_outbox set lease_until=now()-interval '1 second'");
    const second = await db.query('select * from claim_meta_conversion($1,$2)', [randomUUID(), 30]);
    assert.equal(second.rows.length, 1);
    assert.equal(second.rows[0].event_id, 'HOE-TEST');
    assert.equal(second.rows[0].attempts, 2);
  } finally { await db.close(); }
});

