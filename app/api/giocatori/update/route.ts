import { NextResponse } from 'next/server';
import { sql } from '../../../../../lib/db';

export async function POST(req: Request) {
  try {
    const { oldName, newName } = await req.json();
    const sanitizedOld = oldName?.trim();
    const sanitizedNew = newName?.trim();

    if (!sanitizedOld || !sanitizedNew) {
      return NextResponse.json({ error: 'Nomi mancanti' }, { status: 400 });
    }

    // Check if new name already exists
    const existing = await sql`
      SELECT 1 FROM public."Giocatori" WHERE LOWER("Nome") = LOWER(${sanitizedNew})
    `;

    if (existing.length > 0 && sanitizedOld.toLowerCase() !== sanitizedNew.toLowerCase()) {
      return NextResponse.json({ error: 'Giocatore già presente' }, { status: 409 });
    }

    await sql`
      UPDATE public."Giocatori"
      SET "Nome" = ${sanitizedNew}
      WHERE "Nome" = ${sanitizedOld}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
  }
}
