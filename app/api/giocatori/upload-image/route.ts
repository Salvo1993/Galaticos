import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const playerName = formData.get('playerName') as string;
    
    if (!file || !playerName) {
      return NextResponse.json({ error: 'Manca file o nome giocatore' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Converte in Base64
    const mimeType = file.type || 'image/jpeg';
    const base64Image = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // Aggiorna il DB
    await sql`
      UPDATE public."Giocatori"
      SET figurina = ${base64Image}
      WHERE "Nome" = ${playerName}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Errore upload', details: error.message || String(error) }, { status: 500 });
  }
}
