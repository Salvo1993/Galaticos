const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_TOhvPS9Zqf8I@ep-lingering-frost-a2i0975n-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require',
});

async function main() {
  const res = await pool.query(`
    SELECT trigger_name, event_manipulation, event_object_table, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'Risultati';
  `);
  console.log('Triggers:', res.rows);
  pool.end();
}

main().catch(console.error);
