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

    if (sanitizedOld.toLowerCase() !== sanitizedNew.toLowerCase()) {
      const target = sanitizedOld;
      const matches = await sql`SELECT id, team_a_players, team_b_players, marcatori_a, marcatori_b, voti_giocatori, mvps FROM public."Risultati"`;

      for (const match of matches) {
        let updated = false;

        let tap = match.team_a_players;
        let tbp = match.team_b_players;
        let ma = match.marcatori_a;
        let mb = match.marcatori_b;
        let vg = match.voti_giocatori;

        if (Array.isArray(tap) && tap.includes(target)) {
          tap = tap.map((p: string) => p === target ? sanitizedNew : p);
          updated = true;
        }
        if (Array.isArray(tbp) && tbp.includes(target)) {
          tbp = tbp.map((p: string) => p === target ? sanitizedNew : p);
          updated = true;
        }
        if (ma && typeof ma === 'string' && ma.includes(target)) {
          ma = ma.split(',').map((s: string) => {
             const regex = new RegExp(`^${target.replace(/[.*+?^${}()|[\\\]\\]/g, '\\$&')}(\\s*\\(\\d+\\))?$`);
             return regex.test(s.trim()) ? s.trim().replace(target, sanitizedNew) : s.trim();
          }).join(', ');
          updated = true;
        }
        if (mb && typeof mb === 'string' && mb.includes(target)) {
          mb = mb.split(',').map((s: string) => {
             const regex = new RegExp(`^${target.replace(/[.*+?^${}()|[\\\]\\]/g, '\\$&')}(\\s*\\(\\d+\\))?$`);
             return regex.test(s.trim()) ? s.trim().replace(target, sanitizedNew) : s.trim();
          }).join(', ');
          updated = true;
        }
        if (vg && vg[target] !== undefined) {
          vg[sanitizedNew] = vg[target];
          delete vg[target];
          updated = true;
        }

        let matchMvps = match.mvps;
        if (Array.isArray(matchMvps) && matchMvps.includes(target)) {
          matchMvps = matchMvps.map((p: string) => p === target ? sanitizedNew : p);
          updated = true;
        }

        if (updated) {
          await sql`
            UPDATE public."Risultati"
            SET team_a_players = ${JSON.stringify(tap)}::jsonb,
                team_b_players = ${JSON.stringify(tbp)}::jsonb,
                marcatori_a = ${ma ? JSON.stringify(ma) : null}::jsonb,
                marcatori_b = ${mb ? JSON.stringify(mb) : null}::jsonb,
                voti_giocatori = ${vg ? JSON.stringify(vg) : null}::jsonb,
                mvps = ${matchMvps ? JSON.stringify(matchMvps) : '[]'}::jsonb
            WHERE id = ${match.id}
          `;
        }
      }

      await sql`UPDATE public."Media" SET giocatore = ${sanitizedNew} WHERE giocatore = ${target}`;
      await sql`UPDATE public."Media" SET co_giocatore = ${sanitizedNew} WHERE co_giocatore = ${target}`;

      // Update LatestSession
      const sessions = await sql`SELECT * FROM public."LatestSession" WHERE id = 1 LIMIT 1`;
      if (sessions.length > 0) {
        const session = sessions[0];
        let sessionUpdated = false;

        let sp = session.selected_players;
        let c = session.clusters;
        let t_a = session.team_a_players;
        let t_b = session.team_b_players;

        if (Array.isArray(sp) && sp.includes(target)) {
          sp = sp.map((p: string) => p === target ? sanitizedNew : p);
          sessionUpdated = true;
        }

        if (Array.isArray(c)) {
          let cUpdated = false;
          c = c.map((cluster: any) => {
            if (Array.isArray(cluster.members) && cluster.members.includes(target)) {
              cUpdated = true;
              return { ...cluster, members: cluster.members.map((m: string) => m === target ? sanitizedNew : m) };
            }
            return cluster;
          });
          if (cUpdated) sessionUpdated = true;
        }

        if (Array.isArray(t_a) && t_a.includes(target)) {
          t_a = t_a.map((p: string) => p === target ? sanitizedNew : p);
          sessionUpdated = true;
        }

        if (Array.isArray(t_b) && t_b.includes(target)) {
          t_b = t_b.map((p: string) => p === target ? sanitizedNew : p);
          sessionUpdated = true;
        }

        if (sessionUpdated) {
          await sql`
            UPDATE public."LatestSession"
            SET selected_players = ${JSON.stringify(sp)}::jsonb,
                clusters = ${JSON.stringify(c)}::jsonb,
                team_a_players = ${JSON.stringify(t_a)}::jsonb,
                team_b_players = ${JSON.stringify(t_b)}::jsonb
            WHERE id = 1
          `;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
  }
}
