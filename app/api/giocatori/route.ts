import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

export async function GET() {
  try {
    const players = await sql`
      SELECT "Nome" 
      FROM public."Giocatori" 
      ORDER BY "Nome" ASC
    `;
    return NextResponse.json(players);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}
