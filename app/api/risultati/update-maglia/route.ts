import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';

export async function POST(req: Request) {
  try {
    const { id, maglia_chiara } = await req.json();

    if (!id || !maglia_chiara) {
      return NextResponse.json({ success: false, error: 'Dati mancanti' }, { status: 400 });
    }

    await sql`
      UPDATE public."Risultati"
      SET maglia_chiara = ${maglia_chiara}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update Maglia Error:', error);
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500 });
  }
}
