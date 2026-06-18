import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';

export async function POST(req: Request) {
  try {
    const { names } = await req.json();

    if (!Array.isArray(names) || names.length === 0) {
      return NextResponse.json(
        { error: 'Nessun giocatore selezionato' },
        { status: 400 }
      );
    }

    await sql.query(
      'DELETE FROM public."Giocatori" WHERE "Nome" = ANY($1::text[])',
      [names]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Players Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete players' },
      { status: 500 }
    );
  }
}
