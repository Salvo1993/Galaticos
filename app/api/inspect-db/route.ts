import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

export async function GET() {
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
