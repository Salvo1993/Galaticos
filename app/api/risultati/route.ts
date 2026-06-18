import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

export async function GET() {
  try {
    const matches = await sql`
      SELECT * FROM public."Risultati" 
      ORDER BY data DESC, ora DESC
    `;
    return NextResponse.json(matches);
  } catch (error) {
    console.error('Fetch Matches Error:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
