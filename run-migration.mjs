import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

// Try session pooler on port 5432
const configs = [
  { host: 'aws-0-ap-southeast-2.pooler.supabase.com', port: 5432, user: 'postgres.nylejfcszdkamnkkjryt', label: 'session-ap-southeast-2' },
  { host: 'aws-0-ap-southeast-2.pooler.supabase.com', port: 6543, user: 'postgres.nylejfcszdkamnkkjryt', label: 'transaction-ap-southeast-2' },
];

for (const config of configs) {
  const client = new Client({
    host: config.host,
    port: config.port,
    database: 'postgres',
    user: config.user,
    password: 'Cart3rsCar32026',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });
  
  try {
    console.log(`Trying ${config.label} (port ${config.port})...`);
    await client.connect();
    console.log('Connected!');
    const res = await client.query('SELECT 1 as test');
    console.log('Query works:', res.rows);
    await client.end();
    break;
  } catch (err) {
    console.log(`Failed: ${err.message}`);
    try { await client.end(); } catch(e) {}
  }
}
