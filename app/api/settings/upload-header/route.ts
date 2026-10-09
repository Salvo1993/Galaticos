import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const mimeType = file.type || 'image/jpeg';
    const base64Image = `data:${mimeType};base64,${buffer.toString('base64')}`;

    try {
        await sql`ALTER TABLE public."SiteSettings" ADD COLUMN header_image TEXT`;
    } catch(e) {}

    await sql`
      UPDATE public."SiteSettings"
      SET header_image = ${base64Image}, updated_at = NOW()
      WHERE id = 1
    `;

    return NextResponse.json({ success: true, url: base64Image });
  } catch (error: any) {
    console.error('Upload Header Error:', error);
    return NextResponse.json({ error: 'Errore upload', details: error.message || String(error) }, { status: 500 });
  }
}
