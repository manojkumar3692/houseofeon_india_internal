import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const installation = '22222222-2222-4222-8222-222222222222';
const migration = readFileSync('supabase/migration-negotiation-checkout.sql', 'utf8');
const customer = { name:'Test Buyer', phone:'9999999999', email:'test@example.test', address:'Test street 123', city:'Test City', state:'Test State', pincode:'560001' };
async function database() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create table orders(id uuid primary key default gen_random_uuid(),order_number text unique,customer_name text,customer_phone text,
    customer_email text,customer_address text,customer_city text,customer_state text,customer_pincode text,items jsonb,
    subtotal_in_paise integer,coupon_code text,coupon_discount_in_paise integer,amount_in_paise integer,payment_type text,
    token_amount_in_paise integer,balance_due_in_paise integer,cod_balance_status text,payment_status text,shipping_status text,
    razorpay_order_id text,razorpay_payment_id text,payment_captured_at timestamptz);
    create function set_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now();return new;end$$;`);
  await db.exec(readFileSync('tests/fixtures/008_inventory.sql','utf8'));
  await db.exec(readFileSync('tests/fixtures/010_storefront_inventory.sql','utf8'));
  await db.exec(migration);
  return db;
}
const quote = (extra={}) => ({id:randomUUID(),cart:{currency:'INR',lines:[{productId:'arctic-wave',variantId:'arctic-wave:50ml',quantity:1}],promotionCodes:['EON20'],paymentMethod:'prepaid',destination:{country:'IN',postalCode:'560001'}},amountMinor:75000,shippingMinor:0,currency:'INR',expiresAt:new Date(Date.now()+1200000).toISOString(),contextRevision:'test',...extra});
const items = [{productId:'arctic-wave',name:'Arctic Wave',size:'50ml',quantity:1,price:750,lineTotal:750}];
const create = (db,q,key=q.id) => db.query('select create_negotiation_checkout($1,$2,$3,$4) as result',[installation,key,JSON.stringify(q),JSON.stringify(items)]);
const prepare = (db,q,c=customer) => db.query('select prepare_negotiation_payment($1,$2,$3) as result',[q.id,installation,JSON.stringify(c)]);
const apply = (db,q,state,refund=0,confirmed=false) => db.query('select apply_negotiation_state($1,$2,$3,$4,$5,$6,$7) as changed',[q.id,installation,state,state==='cancelled'?null:`pay_${q.id}`,`order_${q.id}`,refund,confirmed]);

test('migration replays, server-only privileges, one approved price only',async()=>{
  const db=await database();
  try {
    await db.exec(migration);
    const {rows}=await db.query('select product_id,regular_minor,selling_minor from store_product_pricing');
    assert.deepEqual(rows,[{product_id:'arctic-wave',regular_minor:124900,selling_minor:99900}]);
    const permissions=await db.query("select has_function_privilege('anon','create_negotiation_checkout(uuid,text,jsonb,jsonb)','execute') as anon,has_function_privilege('authenticated','prepare_negotiation_payment(uuid,uuid,jsonb)','execute') as authenticated,has_table_privilege('anon','negotiation_checkouts','select') as readable");
    assert.deepEqual(permissions.rows,[{anon:false,authenticated:false,readable:false}]);
  } finally {await db.close();}
});
test('quote retries reserve once; conflicts, expiry and stock exhaustion roll back',async()=>{
  const db=await database();
  try {
    const q=quote();
    const results=await Promise.all(Array.from({length:8},()=>create(db,q)));
    assert.equal(results.filter(r=>r.rows[0].result.status==='created').length,1);
    assert.equal((await db.query('select count(*)::int as n from inventory_reservations')).rows[0].n,1);
    await assert.rejects(create(db,{...q,amountMinor:74000}));
    await assert.rejects(create(db,q,'different-key'));
    await assert.rejects(create(db,quote(),q.id));
    await assert.rejects(create(db,quote({expiresAt:new Date(Date.now()-1000).toISOString()})));
    await assert.rejects(create(db,quote({shippingMinor:100})));
    await db.exec("update inventory_skus set current_stock=1 where product_key='arctic-wave' and size='50ml'");
    await assert.rejects(create(db,quote()));
    assert.equal((await db.query('select count(*)::int as n from negotiation_checkouts')).rows[0].n,1);
  } finally {await db.close();}
});
test('customer retry creates one ordinary order with exact quote and zero extra coupon',async()=>{
  const db=await database();
  try {
    const q=quote();await create(db,q);
    await assert.rejects(prepare(db,q,{...customer,pincode:'110001'}));
    const results=await Promise.all(Array.from({length:5},()=>prepare(db,q)));
    assert.equal(results.filter(r=>r.rows[0].result.claimed).length,1);
    const {rows:[o]}=await db.query('select * from orders');
    assert.equal(o.amount_in_paise,75000);assert.equal(o.subtotal_in_paise,75000);
    assert.equal(o.coupon_code,null);assert.equal(o.coupon_discount_in_paise,0);
    assert.equal(o.negotiation_quote_id,q.id);assert.equal(o.negotiation_shipping_minor,0);
    assert.equal(o.items[0].quantity,1);assert.equal(o.items[0].productId,'arctic-wave');
    await assert.rejects(apply(db,q,'cancelled')); // cannot cancel during uncertain external write
    await apply(db,q,'paid');
    await assert.rejects(prepare(db,q));await assert.rejects(create(db,q));
  } finally {await db.close();}
});
test('capture/outbox atomicity, stock deducted once, partial/full refunds and late events',async()=>{
  const db=await database();
  try {
    const q=quote();await create(db,q);await prepare(db,q);
    await apply(db,q,'paid');await apply(db,q,'paid');
    let stock=(await db.query("select current_stock from inventory_skus where product_key='arctic-wave' and size='50ml'")).rows[0].current_stock;
    assert.equal(stock,14);
    await apply(db,q,'paid',10000);
    assert.equal((await db.query('select state,refunded_minor from negotiation_checkouts')).rows[0].state,'paid');
    await assert.rejects(apply(db,q,'refunded',10000));
    await apply(db,q,'refunded',75000);await apply(db,q,'paid');await apply(db,q,'cancelled',0,true);
    assert.equal((await db.query('select state from negotiation_checkouts')).rows[0].state,'refunded');
    assert.equal((await db.query('select count(*)::int as n from negotiation_outbox')).rows[0].n,2);
    stock=(await db.query("select current_stock from inventory_skus where product_key='arctic-wave' and size='50ml'")).rows[0].current_stock;
    assert.equal(stock,14,'refund is not an automatic physical return');
    const event=(await db.query('select claim_negotiation_event($1,$2) as e',[q.id,installation])).rows[0].e;
    assert.equal(event.event_type,'checkout.paid');
    assert.equal((await db.query('select claim_negotiation_event($1,$2) as e',[q.id,installation])).rows[0].e,null);
    await db.query('update negotiation_outbox set delivered_at=now() where event_id=$1',[event.event_id]);
    const next=(await db.query('select claim_negotiation_event($1,$2) as e',[q.id,installation])).rows[0].e;
    assert.equal(next.event_type,'checkout.refunded');
  } finally {await db.close();}
});
test('unpaid cancellation releases reservation and cannot be reused',async()=>{
  const db=await database();
  try {
    const q=quote();await create(db,q);await apply(db,q,'cancelled');
    assert.equal((await db.query('select status from inventory_reservations')).rows[0].status,'released');
    await assert.rejects(create(db,q));await assert.rejects(prepare(db,q));
    assert.equal((await db.query('select count(*)::int as n from orders')).rows[0].n,0);
  } finally {await db.close();}
});

test('six approved pricing rows migration is idempotent and does not touch trial prices',async()=>{
 const db=await database();try{
  await db.exec("insert into store_product_pricing values ('trial-sentinel',24900,24900,'INR','inclusive',now())");
  const sql=readFileSync('supabase/migration-six-perfume-selling-prices.sql','utf8');await db.exec(sql);await db.exec(sql);
  const {rows}=await db.query("select product_id,regular_minor,selling_minor from store_product_pricing where product_id<>'trial-sentinel' order by product_id");
  assert.equal(rows.length,6);for(const row of rows){assert.equal(row.regular_minor,124900);assert.equal(row.selling_minor,99900);}
  assert.equal((await db.query("select selling_minor from store_product_pricing where product_id='trial-sentinel'")).rows[0].selling_minor,24900);
 }finally{await db.close();}
});
