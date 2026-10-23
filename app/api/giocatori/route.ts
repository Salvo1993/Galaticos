import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';
import { recalculateAndSaveClassifica } from '../../../lib/classifica-utils';
import { assertAdmin } from '@/lib/auth';

export const revalidate = 0;

export async function GET() {
  try {
    const injuryColumn = await sql`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Giocatori'
        AND column_name = 'Infortunio'
      LIMIT 1
    `;
    if (injuryColumn.length === 0) {
      await sql`ALTER TABLE public."Giocatori" ADD COLUMN IF NOT EXISTS "Infortunio" TEXT;`;
    }

    const players = await sql`
      SELECT * 
      FROM public."Giocatori" 
      ORDER BY "Nome" ASC
    `;

    const mapped = players.map((p: any) => {
      const hasFigurina = p.figurina && p.figurina.length > 0;
      return {
        ...p,
        figurina: hasFigurina ? `/api/giocatori/avatar?name=${encodeURIComponent(p.Nome)}` : null,
      };
    });

    return NextResponse.json(mapped, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch players', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authError = await assertAdmin(req);
  if (authError) return authError;

  try {
    const { Nome, Ruolo, RuoloSecondario, stats, mergeTarget } = await req.json();
    const sanitizedNome = Nome?.trim();
    const sanitizedRuolo = Ruolo?.trim();
    const sanitizedRuoloSecondario = RuoloSecondario?.trim() || stats?.RuoloSecondario?.trim() || null;

    if (!sanitizedNome || !sanitizedRuolo) {
      return NextResponse.json({ error: 'Nome e Ruolo Preferito sono obbligatori' }, { status: 400 });
    }

    try {
      await sql`ALTER TABLE public."Giocatori" ADD COLUMN IF NOT EXISTS "RuoloSecondario" TEXT;`;
      await sql`ALTER TABLE public."Giocatori" ADD COLUMN IF NOT EXISTS "Infortunio" TEXT;`;
      await sql`ALTER TABLE public."Giocatori" ADD COLUMN IF NOT EXISTS tuffo integer;`;
      await sql`ALTER TABLE public."Giocatori" ADD COLUMN IF NOT EXISTS presa integer;`;
      await sql`ALTER TABLE public."Giocatori" ADD COLUMN IF NOT EXISTS riflessi integer;`;
      await sql`ALTER TABLE public."Giocatori" ADD COLUMN IF NOT EXISTS piazzamento integer;`;
      await sql`ALTER TABLE public."Giocatori" ADD COLUMN IF NOT EXISTS uscite integer;`;
      await sql`ALTER TABLE public."Giocatori" ADD COLUMN IF NOT EXISTS reattivita integer;`;
      await sql`ALTER TABLE public."Giocatori" ADD COLUMN IF NOT EXISTS rinvio integer;`;
    } catch {
      // ignore
    }

    const existing = await sql`
      SELECT 1 FROM public."Giocatori" WHERE LOWER("Nome") = LOWER(${sanitizedNome})
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Giocatore già presente' }, { status: 409 });
    }

    // Process stats
    const { 
      velocita, accelerazione, tecnica, contrasto, passaggi, finalizzazione, resistenza, dribbling, rissa, altezza, peso, piede, Skill, Infortunio, Score,
      tuffo, presa, riflessi, piazzamento, uscite, reattivita, rinvio
    } = stats || {};

    const isGk = sanitizedRuolo === 'Portiere';
    const statFields = isGk
      ? [tuffo, presa, riflessi, piazzamento, uscite, reattivita, rinvio, resistenza, rissa, altezza, peso]
      : [velocita, accelerazione, tecnica, contrasto, passaggi, finalizzazione, resistenza, dribbling, rissa, altezza, peso];
    
    let insertedCount = 0;
    for (const val of statFields) {
        if (val !== undefined && val !== null && val !== '') insertedCount++;
    }
    
    let origine = 'AUTOMATICO';
    if (insertedCount === statFields.length) origine = 'MANUALE';
    else if (insertedCount > 0) origine = 'PARZIALE';

    await sql`
      INSERT INTO public."Giocatori" (
        "Nome", "Ruolo", "RuoloSecondario", velocita, accelerazione, tecnica, contrasto, passaggi, finalizzazione,
        resistenza, dribbling, rissa, altezza, peso, piede, "Skill", "Infortunio", "Score", origine_punteggi,
        tuffo, presa, riflessi, piazzamento, uscite, reattivita, rinvio
      ) VALUES (
        ${sanitizedNome}, ${sanitizedRuolo}, ${sanitizedRuoloSecondario},
        ${velocita ? parseInt(velocita) : null}, ${accelerazione ? parseInt(accelerazione) : null},
        ${tecnica ? parseInt(tecnica) : null}, ${contrasto ? parseInt(contrasto) : null},
        ${passaggi ? parseInt(passaggi) : null}, ${finalizzazione ? parseInt(finalizzazione) : null},
        ${resistenza ? parseInt(resistenza) : null}, ${dribbling ? parseInt(dribbling) : null},
        ${rissa ? parseInt(rissa) : null}, ${altezza ? parseInt(altezza) : null},
        ${peso ? parseInt(peso) : null}, ${piede || null},
        ${Skill?.trim() || null}, ${Infortunio?.trim() || null}, ${Score ? parseInt(Score) : null},
        ${origine},
        ${tuffo ? parseInt(tuffo) : null}, ${presa ? parseInt(presa) : null},
        ${riflessi ? parseInt(riflessi) : null}, ${piazzamento ? parseInt(piazzamento) : null},
        ${uscite ? parseInt(uscite) : null}, ${reattivita ? parseInt(reattivita) : null},
        ${rinvio ? parseInt(rinvio) : null}
      )
    `;

    if (mergeTarget && mergeTarget.trim()) {
      const target = mergeTarget.trim();
      const targetClean = target.replace(/^\(P\)\s*/i, '').trim();
      const targetVariants = Array.from(new Set([target, targetClean, `(P) ${targetClean}`]));

      const isTargetMatch = (name: string) => {
        if (!name || typeof name !== 'string') return false;
        return targetVariants.some(tv => tv.toLowerCase() === name.trim().toLowerCase());
      };

      const getReplacement = (oldName: string) => {
        if (sanitizedNome.startsWith('(P) ')) return sanitizedNome;
        if (oldName.startsWith('(P) ') && isGk) return `(P) ${sanitizedNome}`;
        return sanitizedNome;
      };

      const matches = await sql`SELECT id, team_a_players, team_b_players, marcatori_a, marcatori_b, voti_giocatori, mvps FROM public."Risultati"`;

      for (const match of matches) {
        let updated = false;

        let tap = match.team_a_players;
        let tbp = match.team_b_players;
        let ma = match.marcatori_a;
        let mb = match.marcatori_b;
        let vg = match.voti_giocatori;

        if (Array.isArray(tap) && tap.some((p: string) => isTargetMatch(p))) {
          tap = tap.map((p: string) => isTargetMatch(p) ? getReplacement(p) : p);
          updated = true;
        }
        if (Array.isArray(tbp) && tbp.some((p: string) => isTargetMatch(p))) {
          tbp = tbp.map((p: string) => isTargetMatch(p) ? getReplacement(p) : p);
          updated = true;
        }
        if (ma && typeof ma === 'string') {
          let maUpdated = false;
          const newMa = ma.split(',').map((s: string) => {
             const trimmed = s.trim();
             for (const tv of targetVariants) {
                const regex = new RegExp(`^${tv.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}(\\s*\\([^)]*\\))?$`, 'i');
                if (regex.test(trimmed)) {
                   maUpdated = true;
                   return trimmed.replace(new RegExp(`^${tv.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}`, 'i'), sanitizedNome);
                }
             }
             return trimmed;
          }).join(', ');
          if (maUpdated) {
             ma = newMa;
             updated = true;
          }
        }
        if (mb && typeof mb === 'string') {
          let mbUpdated = false;
          const newMb = mb.split(',').map((s: string) => {
             const trimmed = s.trim();
             for (const tv of targetVariants) {
                const regex = new RegExp(`^${tv.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}(\\s*\\([^)]*\\))?$`, 'i');
                if (regex.test(trimmed)) {
                   mbUpdated = true;
                   return trimmed.replace(new RegExp(`^${tv.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}`, 'i'), sanitizedNome);
                }
             }
             return trimmed;
          }).join(', ');
          if (mbUpdated) {
             mb = newMb;
             updated = true;
          }
        }
        if (vg && typeof vg === 'object') {
          for (const key of Object.keys(vg)) {
            if (isTargetMatch(key)) {
              const rep = getReplacement(key);
              vg[rep] = vg[key];
              delete vg[key];
              updated = true;
            }
          }
        }

        let matchMvps = match.mvps;
        if (Array.isArray(matchMvps) && matchMvps.some((p: string) => isTargetMatch(p))) {
          matchMvps = matchMvps.map((p: string) => isTargetMatch(p) ? getReplacement(p) : p);
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

      // Aggiorna Media
      for (const tv of targetVariants) {
        const mediaTarget = `%${tv}%`;
        const mediaList = await sql`SELECT id, giocatore, co_giocatore FROM public."Media" WHERE giocatore LIKE ${mediaTarget} OR co_giocatore LIKE ${mediaTarget}`;
        
        for (const m of mediaList) {
            let g = m.giocatore;
            let cg = m.co_giocatore;
            let mediaUpdated = false;

            if (g && typeof g === 'string' && g.toLowerCase().includes(tv.toLowerCase())) {
                g = g.split(',').map((s: string) => isTargetMatch(s) ? sanitizedNome : s.trim()).join(', ');
                mediaUpdated = true;
            }
            if (cg && typeof cg === 'string' && cg.toLowerCase().includes(tv.toLowerCase())) {
                cg = cg.split(',').map((s: string) => isTargetMatch(s) ? sanitizedNome : s.trim()).join(', ');
                mediaUpdated = true;
            }
            if (mediaUpdated) {
                await sql`UPDATE public."Media" SET giocatore = ${g}, co_giocatore = ${cg} WHERE id = ${m.id}`;
            }
        }
      }

      // Aggiorna LatestSession
      const sessions = await sql`SELECT * FROM public."LatestSession" WHERE id = 1 LIMIT 1`;
      if (sessions.length > 0) {
        const session = sessions[0];
        let sessionUpdated = false;

        let sp = session.selected_players;
        let c = session.clusters;
        let t_a = session.team_a_players;
        let t_b = session.team_b_players;

        if (Array.isArray(sp) && sp.some((p: string) => isTargetMatch(p))) {
          sp = sp.map((p: string) => isTargetMatch(p) ? getReplacement(p) : p);
          sessionUpdated = true;
        }

        if (Array.isArray(c)) {
          let cUpdated = false;
          c = c.map((cluster: any) => {
            if (Array.isArray(cluster.members) && cluster.members.some((m: string) => isTargetMatch(m))) {
              cUpdated = true;
              return { ...cluster, members: cluster.members.map((m: string) => isTargetMatch(m) ? getReplacement(m) : m) };
            }
            return cluster;
          });
          if (cUpdated) sessionUpdated = true;
        }

        if (Array.isArray(t_a) && t_a.some((p: string) => isTargetMatch(p))) {
          t_a = t_a.map((p: string) => isTargetMatch(p) ? getReplacement(p) : p);
          sessionUpdated = true;
        }

        if (Array.isArray(t_b) && t_b.some((p: string) => isTargetMatch(p))) {
          t_b = t_b.map((p: string) => isTargetMatch(p) ? getReplacement(p) : p);
          sessionUpdated = true;
        }

        if (sessionUpdated) {
          await sql`
            UPDATE public."LatestSession"
            SET selected_players = ${JSON.stringify(sp)}::jsonb,
                clusters = ${JSON.stringify(c)}::jsonb,
                team_a_players = ${JSON.stringify(t_a)}::jsonb,
                team_b_players = ${JSON.stringify(t_b)}::jsonb,
                updated_at = NOW()
            WHERE id = 1
          `;
        }
      }

      // Ricalcola la classifica 
      await recalculateAndSaveClassifica(sql);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Insert Error:', error);
    return NextResponse.json({ error: 'Failed to insert player' }, { status: 500 });
  }
}
