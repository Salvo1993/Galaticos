import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return new NextResponse('Missing player name', { status: 400 });
    }

    const rows = await sql`
      SELECT figurina FROM public."Giocatori" 
      WHERE "Nome" = ${name} 
      LIMIT 1
    `;

    if (!rows || rows.length === 0 || !rows[0].figurina) {
      return new NextResponse('Avatar not found', { status: 404 });
    }

    const figurina = rows[0].figurina;

    // Se è un URL esterno, redirect
    if (figurina.startsWith('http://') || figurina.startsWith('https://')) {
      return NextResponse.redirect(figurina);
    }

    // Se è un Data URI (data:image/png;base64,... o data:image/jpeg;base64,...)
    if (figurina.startsWith('data:')) {
      const commaIndex = figurina.indexOf(',');
      if (commaIndex !== -1) {
        const meta = figurina.substring(0, commaIndex);
        const base64Data = figurina.substring(commaIndex + 1);
        const mimeMatch = meta.match(/data:([^;]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const buffer = Buffer.from(base64Data, 'base64');

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': mimeType,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
          },
        });
      }
    }

    return new NextResponse('Invalid avatar format', { status: 500 });
  } catch (error: any) {
    console.error('Avatar Fetch Error:', error);
    return new NextResponse('Server Error', { status: 500 });
  }
}
