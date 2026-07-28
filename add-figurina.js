const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function main() {
  try {
    await sql`ALTER TABLE public."Giocatori" ADD COLUMN IF NOT EXISTS figurina TEXT;`;
    console.log("Colonna figurina aggiunta con successo al DB!");
  } catch (err) {
    console.error("Errore durante alter table:", err);
  }
}
main();
