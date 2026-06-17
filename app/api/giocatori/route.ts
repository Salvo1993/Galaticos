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

export async function POST(req: Request) {
  try {
    const { Nome } = await req.json();
    const sanitizedNome = Nome.trim();
    if (!sanitizedNome) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 });

    const existing = await sql`
      SELECT 1 FROM public."Giocatori" WHERE LOWER("Nome") = LOWER(${sanitizedNome})
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Giocatore già presente' }, { status: 409 });
    }

    await sql`INSERT INTO public."Giocatori" ("Nome") VALUES (${sanitizedNome})`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Insert Error:', error);
    return NextResponse.json({ error: 'Failed to insert player' }, { status: 500 });
  }
}
