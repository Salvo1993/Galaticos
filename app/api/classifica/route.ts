import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';
import { recalculateAndSaveClassifica } from '../../../lib/classifica-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRecalculate = searchParams.get('recalculate') === 'true';

    let leaderboard;

    if (forceRecalculate) {
      // Ricalcola da zero e aggiorna il DB (usato solo per inizializzazione o debug)
      leaderboard = await recalculateAndSaveClassifica(sql);
    } else {
      // Legge la classifica già calcolata dalla tabella (aggiornata dal POST update/delete)
      try {
        const rows = await sql`
          SELECT * FROM (
            SELECT DISTINCT ON (nome) nome, pt_partita, partite_giocate, punti_assoluti, gol_fatti, vittorie, pareggi, sconfitte, media_voto, mvp_count
            FROM public."classifica"
          ) AS unique_classifica
          ORDER BY punti_assoluti DESC, pt_partita DESC, media_voto DESC, gol_fatti DESC, nome ASC
        `;
        leaderboard = rows.map((r: any) => ({
          ...r,
          pt_partita: typeof r.pt_partita === 'number' ? r.pt_partita : parseFloat(r.pt_partita || '0')
        }));
      } catch (err) {
        console.warn("Tabella non aggiornata, forzo ricalcolo:", err);
        leaderboard = await recalculateAndSaveClassifica(sql);
      }
    }

    return NextResponse.json(
      { success: true, leaderboard },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Classifica Error:', error);
    return NextResponse.json(
      { success: false, error: 'Errore nel recupero della classifica' },
      { status: 500 }
    );
  }
}
