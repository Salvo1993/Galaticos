import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';
import { assertAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  const authError = await assertAdmin(req);
  if (authError) return authError;

  try {
    const triggers = await sql`
      SELECT trigger_name, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'Risultati';
    `;
    return NextResponse.json({ triggers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
