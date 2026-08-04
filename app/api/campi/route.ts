import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

export async function GET() {
  try {
    const campi = await sql`SELECT id, nome, posizione_url FROM public."Campi" ORDER BY nome ASC`;
    return NextResponse.json(campi);
  } catch (error) {
    console.error('API Campi Error:', error);
    return NextResponse.json({ error: 'Failed to fetch campi' }, { status: 500 });
  }
}
