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
    const { nome, posizione_url } = await req.json();
    
    if (!nome) {
      return NextResponse.json({ error: 'Nome campo obbligatorio' }, { status: 400 });
    }

    await sql`
      INSERT INTO public."Campi" (nome, posizione_url) 
      VALUES (${nome}, ${posizione_url || null})
      ON CONFLICT (nome) DO UPDATE SET posizione_url = EXCLUDED.posizione_url;
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Add Campo Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to add campo' }, { status: 500 });
  }
}
