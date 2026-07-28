import { neon } from '@neondatabase/serverless';

// Permette alla build di Vercel di passare anche se il DB non è ancora collegato
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgres://dummy:dummy@dummy/dummy';

export const sql = neon(connectionString);
