import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';

export async function POST(req: Request) {
  try {
    const { oldName, newName, newRole, stats } = await req.json();
    const sanitizedOld = oldName?.trim();
    const sanitizedNew = newName?.trim();
    const sanitizedRole = newRole?.trim() || null;

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

    // Process stats
    const { velocita, accelerazione, tecnica, contrasto, passaggi, finalizzazione, resistenza, dribbling, rissa, altezza, peso, piede, Skill, Score } = stats || {};
    const statFields = [velocita, accelerazione, tecnica, contrasto, passaggi, finalizzazione, resistenza, dribbling, rissa, altezza, peso];
    
    let insertedCount = 0;
    for (const val of statFields) {
        if (val !== undefined && val !== null && val !== '') insertedCount++;
    }
    
    let origine = 'AUTOMATICO';
    if (insertedCount === statFields.length) origine = 'MANUALE';
    else if (insertedCount > 0) origine = 'PARZIALE';

    await sql`
      UPDATE public."Giocatori"
      SET 
        "Nome" = ${sanitizedNew}, 
        "Ruolo" = ${sanitizedRole},
        velocita = ${velocita ? parseInt(velocita) : null},
        accelerazione = ${accelerazione ? parseInt(accelerazione) : null},
        tecnica = ${tecnica ? parseInt(tecnica) : null},
        contrasto = ${contrasto ? parseInt(contrasto) : null},
        passaggi = ${passaggi ? parseInt(passaggi) : null},
        finalizzazione = ${finalizzazione ? parseInt(finalizzazione) : null},
        resistenza = ${resistenza ? parseInt(resistenza) : null},
        dribbling = ${dribbling ? parseInt(dribbling) : null},
        rissa = ${rissa ? parseInt(rissa) : null},
        altezza = ${altezza ? parseInt(altezza) : null},
        peso = ${peso ? parseInt(peso) : null},
        piede = ${piede || null},
        "Skill" = ${Skill || null},
        "Score" = ${Score ? parseInt(Score) : null},
        origine_punteggi = ${origine}
      WHERE "Nome" = ${sanitizedOld}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
  }
}
