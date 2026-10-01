import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    let targetMonth = searchParams.get('month');
    if (!targetMonth) {
      const d = new Date();
      d.setMonth(d.getMonth() - 1); // Prende il mese precedente
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      targetMonth = `${y}-${m}`;
    }
    
    console.log(`Calcolando i vincitori per il mese: ${targetMonth}`);
    const [yyyy, mm] = targetMonth.split('-');
    
    // Costruisci il wildcard es: 2026-09-%
    const monthPattern = `${yyyy}-${mm}-%`;
    
    const matches = await sql`
      SELECT * FROM public."Risultati" 
      WHERE data::text LIKE ${monthPattern}
      AND risultato IS NOT NULL 
      AND risultato != ''
      AND risultato != '0-0'
    `;

    if (matches.length === 0) {
      return NextResponse.json({ success: false, error: `Nessuna partita trovata per ${targetMonth}` });
    }

    const stats: Record<string, any> = {};

    matches.forEach(match => {
      const parts = match.risultato.split('-');
      const scoreA = parseInt(parts[0]?.trim(), 10) || 0;
      const scoreB = parseInt(parts[1]?.trim(), 10) || 0;

      let pointsA = scoreA === scoreB ? 1 : (scoreA > scoreB ? 3 : 0);
      let pointsB = scoreA === scoreB ? 1 : (scoreB > scoreA ? 3 : 0);

      const processPlayers = (players: string[], teamPoints: number, marcatoriObj: any) => {
        if (!Array.isArray(players)) return;
        players.forEach(p => {
          if (!stats[p]) stats[p] = { name: p, matches: 0, mvp: 0, sumVoto: 0, punti: 0, gol: 0, storicoVoti: [] };
          stats[p].matches += 1;
          stats[p].punti += teamPoints;

          let playerVoto = teamPoints === 3 ? 7 : (teamPoints === 1 ? 6 : 5);
          if (match.voti_giocatori && typeof match.voti_giocatori === 'object') {
            if (match.voti_giocatori[p]) {
              playerVoto = parseFloat(match.voti_giocatori[p]) || playerVoto;
            }
          }
          stats[p].sumVoto += playerVoto;

          let matchDateStr = "Sconosciuta";
          if (match.data) {
             const d = new Date(match.data);
             if (!isNaN(d.getTime())) {
                matchDateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
             }
          }
          stats[p].storicoVoti.push({ date: matchDateStr, voto: playerVoto });
          
          if (marcatoriObj) {
            if (typeof marcatoriObj === 'string') {
              const cleanObj = marcatoriObj.replace(/^["']|["']$/g, '');
              const parts = cleanObj.split(',');
              parts.forEach(part => {
                const str = part.trim();
                if (str) {
                  const matchResult = str.match(/^(.*?)(?:\s*\(\s*(\d+)\s*\))?$/);
                  if (matchResult) {
                    const mName = matchResult[1].trim();
                    const numGol = parseInt(matchResult[2] || '1', 10);
                    if (mName === p) {
                      stats[p].gol += numGol;
                    }
                  }
                }
              });
            } else if (Array.isArray(marcatoriObj)) {
              const mar = marcatoriObj.find((m: any) => m.nome === p);
              if (mar) stats[p].gol += parseInt(mar.gol, 10) || 0;
            } else if (typeof marcatoriObj === 'object') {
              if (marcatoriObj[p]) stats[p].gol += parseInt(marcatoriObj[p], 10) || 0;
            }
          }

          if (Array.isArray(match.mvps) && match.mvps.includes(p)) {
            stats[p].mvp += 1;
          }
        });
      };

      processPlayers(match.team_a_players, pointsA, match.marcatori_a);
      processPlayers(match.team_b_players, pointsB, match.marcatori_b);
    });

    let maxMvp = 1, maxPunti = 1, maxGol = 1;
    Object.values(stats).forEach(p => {
      p.mediaVoto = p.matches > 0 ? (p.sumVoto / p.matches) : 0;
      if (p.mvp > maxMvp) maxMvp = p.mvp;
      if (p.punti > maxPunti) maxPunti = p.punti;
      if (p.gol > maxGol) maxGol = p.gol;
    });

    const finalScoreboard = Object.values(stats).map(p => {
      const sMvp = (p.mvp / maxMvp) * 35;
      
      let mVoto = p.mediaVoto;
      if (mVoto < 4) mVoto = 4;
      if (mVoto > 10) mVoto = 10;
      const sVoto = ((mVoto - 4) / 6) * 35;
      
      const sPunti = (p.punti / maxPunti) * 20;
      const sGol = (p.gol / maxGol) * 10;
      
      const matchRatio = p.matches / matches.length;
      let handicap = 1.0;
      if (matchRatio < 0.5) handicap = 0.5;

      const aggregateIndex = (sMvp + sVoto + sPunti + sGol) * handicap;

      return {
        ...p,
        aggregateIndex,
        mediaVoto: parseFloat(p.mediaVoto.toFixed(2))
      };
    });

    finalScoreboard.sort((a, b) => b.aggregateIndex - a.aggregateIndex);
    
    if (finalScoreboard.length < 3) {
        return NextResponse.json({ success: false, error: 'Non ci sono abbastanza giocatori giocanti per formare un podio in questo mese.' });
    }

    const primo_posto = finalScoreboard[0].name;
    const secondo_posto = finalScoreboard[1].name;
    const terzo_posto = finalScoreboard[2].name;

    const giocatori = await sql`SELECT "Nome", "figurina" FROM public."Giocatori"`;
    const avatarMap: Record<string, string> = {};
    giocatori.forEach((g: any) => {
        if (g.Nome && g.figurina) {
            avatarMap[g.Nome] = g.figurina;
        }
    });

    const top3stats = finalScoreboard.slice(0, 3).map(p => ({
       name: p.name,
       punteggio: parseFloat(p.aggregateIndex.toFixed(1)),
       mvp: p.mvp,
       mediaVoto: p.mediaVoto,
       punti: p.punti,
       gol: p.gol,
       figurina: avatarMap[p.name] || null,
       storicoVoti: p.storicoVoti
    }));

    await sql`
      INSERT INTO public."Awards" (mese_anno, primo_posto, secondo_posto, terzo_posto, stats_details)
      VALUES (${targetMonth}, ${primo_posto}, ${secondo_posto}, ${terzo_posto}, ${JSON.stringify(top3stats)}::jsonb)
      ON CONFLICT (mese_anno) 
      DO UPDATE SET 
        primo_posto = EXCLUDED.primo_posto,
        secondo_posto = EXCLUDED.secondo_posto,
        terzo_posto = EXCLUDED.terzo_posto,
        stats_details = EXCLUDED.stats_details
    `;

    return NextResponse.json({
      success: true,
      message: `Giocatori del mese calcolati e salvati con successo per ${targetMonth}!`,
      podium: {
          primo: { name: primo_posto, punteggio: finalScoreboard[0].aggregateIndex },
          secondo: { name: secondo_posto, punteggio: finalScoreboard[1].aggregateIndex },
          terzo: { name: terzo_posto, punteggio: finalScoreboard[2].aggregateIndex }
      }
    });

  } catch (error: any) {
    console.error('Calculate Awards Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
