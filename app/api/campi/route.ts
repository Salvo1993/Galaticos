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

export async function POST(req: Request) {
  try {
    const { id, nome, posizione_url } = await req.json();
    
    if (!nome) {
      return NextResponse.json({ error: 'Nome campo obbligatorio' }, { status: 400 });
    }

    if (id) {
      const existing = await sql`SELECT * FROM public."Campi" WHERE nome = ${nome} AND id != ${id}`;
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Un altro campo con questo nome esiste già' }, { status: 400 });
      }
      await sql`
        UPDATE public."Campi" 
        SET nome = ${nome}, posizione_url = ${posizione_url || null}
        WHERE id = ${id}
      `;
    } else {
      await sql`
        INSERT INTO public."Campi" (nome, posizione_url) 
        VALUES (${nome}, ${posizione_url || null})
        ON CONFLICT (nome) DO UPDATE SET posizione_url = EXCLUDED.posizione_url;
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Add Campo Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to add campo' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'ID campo obbligatorio' }, { status: 400 });
    }
    
    await sql`DELETE FROM public."Campi" WHERE id = ${id}`;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Delete Campo Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete campo' }, { status: 500 });
  }
}
