import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

export const revalidate = 0;

export async function GET() {
  try {
    const players = await sql`
      SELECT * 
      FROM public."Giocatori" 
      ORDER BY "Nome" ASC
    `;
    return NextResponse.json(players);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { Nome, Ruolo, stats, mergeTarget } = await req.json();
    const sanitizedNome = Nome?.trim();
    const sanitizedRuolo = Ruolo?.trim();

    if (!sanitizedNome || !sanitizedRuolo) {
      return NextResponse.json({ error: 'Nome e Ruolo sono obbligatori' }, { status: 400 });
    }

    const existing = await sql`
      SELECT 1 FROM public."Giocatori" WHERE LOWER("Nome") = LOWER(${sanitizedNome})
    `;

    if (existing.length > 0) {
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
      INSERT INTO public."Giocatori" (
        "Nome", "Ruolo", velocita, accelerazione, tecnica, contrasto, passaggi, finalizzazione,
        resistenza, dribbling, rissa, altezza, peso, piede, "Skill", "Score", origine_punteggi
      ) VALUES (
        ${sanitizedNome}, ${sanitizedRuolo},
        ${velocita ? parseInt(velocita) : null}, ${accelerazione ? parseInt(accelerazione) : null},
        ${tecnica ? parseInt(tecnica) : null}, ${contrasto ? parseInt(contrasto) : null},
        ${passaggi ? parseInt(passaggi) : null}, ${finalizzazione ? parseInt(finalizzazione) : null},
        ${resistenza ? parseInt(resistenza) : null}, ${dribbling ? parseInt(dribbling) : null},
        ${rissa ? parseInt(rissa) : null}, ${altezza ? parseInt(altezza) : null},
        ${peso ? parseInt(peso) : null}, ${piede || null},
        ${Skill || null}, ${Score ? parseInt(Score) : null},
        ${origine}
      )
    `;

    if (mergeTarget && mergeTarget.trim()) {
      const target = mergeTarget.trim();

      const matches = await sql`SELECT id, team_a_players, team_b_players, marcatori_a, marcatori_b, voti_giocatori FROM public."Risultati"`;

      for (const match of matches) {
        let updated = false;

        let tap = match.team_a_players;
        let tbp = match.team_b_players;
        let ma = match.marcatori_a;
        let mb = match.marcatori_b;
        let vg = match.voti_giocatori;

        if (Array.isArray(tap) && tap.includes(target)) {
          tap = tap.map((p: string) => p === target ? sanitizedNome : p);
          updated = true;
        }
        if (Array.isArray(tbp) && tbp.includes(target)) {
          tbp = tbp.map((p: string) => p === target ? sanitizedNome : p);
          updated = true;
        }
        if (ma && typeof ma === 'string' && ma.includes(target)) {
          ma = ma.split(',').map((s: string) => s.trim() === target ? sanitizedNome : s.trim()).join(',');
          updated = true;
        }
        if (mb && typeof mb === 'string' && mb.includes(target)) {
          mb = mb.split(',').map((s: string) => s.trim() === target ? sanitizedNome : s.trim()).join(',');
          updated = true;
        }
        if (vg && vg[target] !== undefined) {
          vg[sanitizedNome] = vg[target];
          delete vg[target];
          updated = true;
        }

        if (updated) {
          await sql`
            UPDATE public."Risultati"
            SET team_a_players = ${JSON.stringify(tap)}::jsonb,
                team_b_players = ${JSON.stringify(tbp)}::jsonb,
                marcatori_a = ${ma},
                marcatori_b = ${mb},
                voti_giocatori = ${vg ? JSON.stringify(vg) : null}::jsonb
            WHERE id = ${match.id}
          `;
        }
      }

      await sql`UPDATE public."Media" SET giocatore = ${sanitizedNome} WHERE giocatore = ${target}`;
      await sql`UPDATE public."Media" SET co_giocatore = ${sanitizedNome} WHERE co_giocatore = ${target}`;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Insert Error:', error);
    return NextResponse.json({ error: 'Failed to insert player' }, { status: 500 });
  }
}
