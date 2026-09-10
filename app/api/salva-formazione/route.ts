import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

const months: Record<string, string> = {
  'gennaio': '01', 'febbraio': '02', 'marzo': '03', 'aprile': '04',
  'maggio': '05', 'giugno': '06', 'luglio': '07', 'agosto': '08',
  'settembre': '09', 'ottobre': '10', 'novembre': '11', 'dicembre': '12'
};

export async function POST(req: Request) {
  try {
    // Parse match_label per ottenere la chiave univoca (data + ora)
    const { team_a_name, team_b_name, teamAPlayers, teamBPlayers, stadium, matchLabel: inputMatchLabel, maglia_chiara } = await req.json();

    if (!team_a_name || !team_b_name || !Array.isArray(teamAPlayers) || !Array.isArray(teamBPlayers)) {
      return NextResponse.json({ error: 'Dati squadra mancanti o invalidi' }, { status: 400 });
    }

    let matchLabel = inputMatchLabel;
    if (!matchLabel) {
      const settings = await sql`SELECT match_label FROM public."SiteSettings" WHERE id = 1`;
      matchLabel = settings[0]?.match_label || 'Venerdì 19 giugno - Ore 21';
    }
    const parts = matchLabel.split('-').map((p: string) => p.trim());
    const datePart = (parts[0] || '').split(' ');
    const day = datePart[1] || '01';
    const monthName = (datePart[2] || '').toLowerCase();
    const month = months[monthName] || '01';
    const dateStr = `2026-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const timePart = (parts[1] || '').toLowerCase().replace('ore', '').trim();
    const timeStr = `${(timePart || '21').padStart(2, '0')}:00`;

    // Controlla se la partita è già stata giocata
    const existingMatch = await sql`
      SELECT id, risultato FROM public."Risultati" WHERE data = ${dateStr} AND ora = ${timeStr}
    `;

    if (existingMatch.length > 0 && existingMatch[0].risultato && existingMatch[0].risultato !== '0-0') {
      return NextResponse.json({ error: 'Questa partita è già stata giocata definitivamente, impossibile sovrascrivere le formazioni.' }, { status: 400 });
    }

    // Operazione Atomica usando sql.transaction
    await sql.transaction([
        // A) Upsert LatestSession (Singleton con ID 1)
        sql`
          INSERT INTO public."LatestSession" (
            id, selected_players, clusters, team_a_name, team_b_name, team_a_players, team_b_players, updated_at
          )
          VALUES (
            1,
            '[]'::jsonb, 
            '[]'::jsonb, 
            ${team_a_name}, 
            ${team_b_name}, 
            ${JSON.stringify(teamAPlayers)}::jsonb, 
            ${JSON.stringify(teamBPlayers)}::jsonb, 
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            team_a_name = EXCLUDED.team_a_name,
            team_b_name = EXCLUDED.team_b_name,
            team_a_players = EXCLUDED.team_a_players,
            team_b_players = EXCLUDED.team_b_players,
            updated_at = NOW();
        `,

        // B) Upsert Risultati (basato su vincolo unico data+ora)
        sql`
          INSERT INTO public."Risultati" (data, ora, team_a_name, team_b_name, team_a_players, team_b_players, "Stadium", maglia_chiara)
          VALUES (${dateStr}, ${timeStr}, ${team_a_name}, ${team_b_name}, ${JSON.stringify(teamAPlayers)}::jsonb, ${JSON.stringify(teamBPlayers)}::jsonb, ${stadium || 'Campi Sole'}, ${maglia_chiara || 'A'})
          ON CONFLICT (data, ora) DO UPDATE SET
            team_a_name = EXCLUDED.team_a_name,
            team_b_name = EXCLUDED.team_b_name,
            team_a_players = EXCLUDED.team_a_players,
            team_b_players = EXCLUDED.team_b_players,
            "Stadium" = EXCLUDED."Stadium",
            maglia_chiara = EXCLUDED.maglia_chiara;
        `
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save Formation Error:', error);
    return NextResponse.json({ error: 'Failed to save formation' }, { status: 500 });
  }
}
