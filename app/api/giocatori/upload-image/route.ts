import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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

    let ext = path.extname(file.name).toLowerCase();
    if (!['.png', '.jpeg', '.jpg'].includes(ext)) {
        ext = '.png'; // Fallback for safety
    }
    
    const filename = `${playerName}${ext}`;
    const publicPlayersDir = path.join(process.cwd(), 'public', 'players');
    
    await fs.mkdir(publicPlayersDir, { recursive: true });
    
    // Clear out old extensions for the same player
    const exts = ['.png', '.jpg', '.jpeg'];
    for (const extension of exts) {
        const oldFile = path.join(publicPlayersDir, `${playerName}${extension}`);
        try {
            await fs.unlink(oldFile);
        } catch(e) {}
    }

    const filePath = path.join(publicPlayersDir, filename);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ success: true, filename });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Errore upload', details: error.message || String(error) }, { status: 500 });
  }
}
