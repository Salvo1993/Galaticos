import type { Results, MatchResult, MediaItem, Campo } from '@/types';

export const fallbackCopyText = (
  text: string,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('Link WhatsApp copiati negli appunti! 📋', 'success');
  } catch {
    showToast('Errore durante la copia', 'error');
  }
  document.body.removeChild(textArea);
};

export const copyMatchMediaToClipboard = (
  match: MatchResult,
  mediaItems: MediaItem[],
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
) => {
  const items = mediaItems.filter(m => m.partita_id === match.id);
  if (items.length === 0) {
    showToast('Nessun video registrato per questa partita', 'info');
    return;
  }

  const fullMatchItems = items.filter(i => i.tipologia === 'Partita Completa');
  const sintesiItems = items.filter(i => i.tipologia === 'Sintesi');
  const playerItems = items.filter(i => i.tipologia !== 'Partita Completa' && i.tipologia !== 'Sintesi');

  const cleanUrl = (idOrUrl: string) => {
    if (!idOrUrl) return '';
    const trimmed = idOrUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://www.youtube.com/watch?v=${trimmed}`;
  };

  // Group player items by player name
  const playerMap: Record<string, MediaItem[]> = {};
  playerItems.forEach(item => {
    const pName = (item.giocatore || 'Altri').trim();
    if (!playerMap[pName]) playerMap[pName] = [];
    playerMap[pName].push(item);
  });

  // Sort players by: most goals first, then total items
  const sortedPlayers = Object.keys(playerMap).sort((a, b) => {
    const goalsA = playerMap[a].filter(i => i.tipologia === 'Golazo' || i.tipologia === 'Gol').length;
    const goalsB = playerMap[b].filter(i => i.tipologia === 'Golazo' || i.tipologia === 'Gol').length;
    if (goalsB !== goalsA) return goalsB - goalsA;
    return playerMap[b].length - playerMap[a].length;
  });

  const matchDate = new Date(match.data);
  const today = new Date();
  const diffDays = Math.round((today.getTime() - matchDate.getTime()) / (1000 * 3600 * 24));
  const dateLabel =
    diffDays === 1 ? 'della partita di ieri' : `della partita del ${matchDate.toLocaleDateString('it-IT')}`;

  let message = `⚽🎬 HIGHLIGHTS & GOL | ${(match.team_a_name || 'SQUADRA A').toUpperCase()} - ${(match.team_b_name || 'SQUADRA B').toUpperCase()} 🎬⚽\n\n`;
  message += `Ecco tutti i video dei gol e delle giocate ${dateLabel}! 👇\n\n`;

  sortedPlayers.forEach(pName => {
    message += `👤 ${pName.toUpperCase()}\n`;
    const pClips = playerMap[pName];

    const goals = pClips.filter(c => c.tipologia === 'Golazo' || c.tipologia === 'Gol');
    const giocate = pClips.filter(c => c.tipologia === 'Giocata');
    const parate = pClips.filter(c => c.tipologia === 'Paratona' || c.tipologia === 'Parata');
    const fails = pClips.filter(c => c.tipologia === 'Epic Fail');
    const others = pClips.filter(
      c => !['Golazo', 'Gol', 'Giocata', 'Paratona', 'Parata', 'Epic Fail'].includes(c.tipologia)
    );

    goals.forEach((g, idx) => {
      const label = goals.length > 1 ? `${idx + 1}° Gol` : 'Gol';
      message += `⚽ ${label}: ${cleanUrl(g.youtube_id)}\n`;
    });

    giocate.forEach((g, idx) => {
      const label = giocate.length > 1 ? `${idx + 1}ª Giocata` : 'Giocata';
      message += `✨ ${label}: ${cleanUrl(g.youtube_id)}\n`;
    });

    parate.forEach((p, idx) => {
      const label = parate.length > 1 ? `${idx + 1}ª Paratona` : 'Paratona';
      message += `🧤 ${label}: ${cleanUrl(p.youtube_id)}\n`;
    });

    fails.forEach((f, idx) => {
      const label = fails.length > 1 ? `${idx + 1}° Epic Fail` : 'Epic Fail';
      message += `🤡 ${label}: ${cleanUrl(f.youtube_id)}\n`;
    });

    others.forEach(o => {
      message += `🎬 ${o.tipologia}: ${cleanUrl(o.youtube_id)}\n`;
    });

    message += `\n`;
  });

  if (sintesiItems.length > 0) {
    message += `---\n`;
    sintesiItems.forEach(s => {
      message += `⚡ Sintesi Partita: ${cleanUrl(s.youtube_id)}\n`;
    });
  }

  if (fullMatchItems.length > 0) {
    if (sintesiItems.length === 0) message += `---\n`;
    fullMatchItems.forEach(f => {
      message += `🎥 Partita Completa: ${cleanUrl(f.youtube_id)}\n`;
    });
  }

  const trimmedMsg = message.trim();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(trimmedMsg)
      .then(() => {
        showToast('Link WhatsApp copiati negli appunti! 📋', 'success');
      })
      .catch(() => {
        fallbackCopyText(trimmedMsg, showToast);
      });
  } else {
    fallbackCopyText(trimmedMsg, showToast);
  }
};

export const copyPlayerMediaToClipboard = (
  playerName: string,
  mediaItems: MediaItem[],
  matches: MatchResult[],
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void,
  filterPartitaId?: string,
  filterTipologia?: string
) => {
  const cleanUrl = (idOrUrl: string) => {
    if (!idOrUrl) return '';
    const trimmed = idOrUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://www.youtube.com/watch?v=${trimmed}`;
  };

  const targetPlayer = playerName.trim();
  const playerMedia = mediaItems.filter(m => {
    if (filterPartitaId && String(m.partita_id) !== filterPartitaId) return false;
    if (filterTipologia) {
      const matchTip =
        m.tipologia === filterTipologia ||
        (filterTipologia === 'Paratona' && m.tipologia === 'Parata') ||
        (filterTipologia === 'Parata' && m.tipologia === 'Paratona');
      if (!matchTip) return false;
    }

    if (
      m.giocatore?.includes(targetPlayer) ||
      m.co_giocatore?.includes(targetPlayer)
    ) {
      return true;
    }

    const match = matches.find(x => x.id === m.partita_id);
    if (match) {
      const inTeamA = match.team_a_players?.includes(targetPlayer);
      const inTeamB = match.team_b_players?.includes(targetPlayer);
      const playedInMatch = inTeamA || inTeamB;

      if ((m.tipologia === 'Partita Completa' || m.tipologia === 'Sintesi') && playedInMatch) return true;
      if (m.giocatore === match.team_a_name && inTeamA) return true;
      if (m.giocatore === match.team_b_name && inTeamB) return true;
      if (m.co_giocatore === match.team_a_name && inTeamA) return true;
      if (m.co_giocatore === match.team_b_name && inTeamB) return true;
    }

    return false;
  });

  if (playerMedia.length === 0) {
    showToast(`Nessun video trovato per ${targetPlayer}`, 'info');
    return;
  }

  // Raggruppa i video del giocatore per partita
  const matchMap: Record<string, { match: MatchResult | undefined; items: MediaItem[] }> = {};
  playerMedia.forEach(item => {
    const pId = item.partita_id ? String(item.partita_id) : 'other';
    if (!matchMap[pId]) {
      matchMap[pId] = {
        match: matches.find(m => String(m.id) === pId),
        items: []
      };
    }
    matchMap[pId].items.push(item);
  });

  // Ordina le partite per data decrescente (la più recente prima)
  const sortedMatchKeys = Object.keys(matchMap).sort((a, b) => {
    const matchA = matchMap[a].match;
    const matchB = matchMap[b].match;
    if (matchA && matchB) {
      return new Date(matchB.data).getTime() - new Date(matchA.data).getTime();
    }
    if (matchA) return -1;
    if (matchB) return 1;
    return 0;
  });

  let message = `⚽🎬 VIDEO & GIOCATE | ${targetPlayer.toUpperCase()} 🎬⚽\n\n`;
  if (filterPartitaId && matchMap[filterPartitaId]?.match) {
    const m = matchMap[filterPartitaId].match!;
    const dateStr = new Date(m.data).toLocaleDateString('it-IT');
    message += `Ecco tutti i video della partita del ${dateStr} (${m.team_a_name} vs ${m.team_b_name})! 👇\n\n`;
  } else {
    message += `Ecco tutti i video di ${targetPlayer} suddivisi per partita! 👇\n\n`;
  }

  sortedMatchKeys.forEach(pId => {
    const { match, items } = matchMap[pId];
    if (match) {
      const dStr = new Date(match.data).toLocaleDateString('it-IT');
      const resStr = match.risultato ? ` (${match.risultato})` : '';
      message += `📅 *${dStr}* — *${match.team_a_name} vs ${match.team_b_name}*${resStr}\n`;
    } else {
      message += `🎬 *Altri Video*\n`;
    }

    const goals = items.filter(c => c.tipologia === 'Golazo' || c.tipologia === 'Gol');
    const giocate = items.filter(c => c.tipologia === 'Giocata');
    const parate = items.filter(c => c.tipologia === 'Paratona' || c.tipologia === 'Parata');
    const fails = items.filter(c => c.tipologia === 'Epic Fail');
    const sintesi = items.filter(c => c.tipologia === 'Sintesi');
    const fullMatch = items.filter(c => c.tipologia === 'Partita Completa');
    const others = items.filter(
      c => !['Golazo', 'Gol', 'Giocata', 'Paratona', 'Parata', 'Epic Fail', 'Sintesi', 'Partita Completa'].includes(c.tipologia)
    );

    goals.forEach((g, idx) => {
      const label = goals.length > 1 ? `${idx + 1}° Gol` : 'Gol';
      message += `⚽ ${label}: ${cleanUrl(g.youtube_id)}\n`;
    });

    giocate.forEach((g, idx) => {
      const label = giocate.length > 1 ? `${idx + 1}ª Giocata` : 'Giocata';
      message += `✨ ${label}: ${cleanUrl(g.youtube_id)}\n`;
    });

    parate.forEach((p, idx) => {
      const label = parate.length > 1 ? `${idx + 1}ª Paratona` : 'Paratona';
      message += `🧤 ${label}: ${cleanUrl(p.youtube_id)}\n`;
    });

    fails.forEach((f, idx) => {
      const label = fails.length > 1 ? `${idx + 1}° Epic Fail` : 'Epic Fail';
      message += `🤡 ${label}: ${cleanUrl(f.youtube_id)}\n`;
    });

    others.forEach(o => {
      message += `🎬 ${o.tipologia}: ${cleanUrl(o.youtube_id)}\n`;
    });

    sintesi.forEach(s => {
      message += `⚡ Sintesi: ${cleanUrl(s.youtube_id)}\n`;
    });

    fullMatch.forEach(f => {
      message += `🎥 Partita Completa: ${cleanUrl(f.youtube_id)}\n`;
    });

    message += `\n`;
  });

  const trimmedMsg = message.trim();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(trimmedMsg)
      .then(() => {
        showToast(`Link video di ${targetPlayer} copiati negli appunti! 📋`, 'success');
      })
      .catch(() => {
        fallbackCopyText(trimmedMsg, showToast);
      });
  } else {
    fallbackCopyText(trimmedMsg, showToast);
  }
};

export interface CopyResultsParams {
  results: Results | null;
  matches: MatchResult[];
  dbCampi: Campo[];
  teamAName: string;
  teamBName: string;
  userOverrideMaglia: 'A' | 'B' | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const copyResultsToClipboard = ({
  results,
  matches,
  dbCampi,
  teamAName,
  teamBName,
  userOverrideMaglia,
  showToast,
}: CopyResultsParams) => {
  if (!results) return;

  const e_soccer = String.fromCodePoint(0x26bd);
  const e_dash = String.fromCodePoint(0x2014);
  const e_ord = String.fromCodePoint(0x00aa);
  const e_cal = String.fromCodePoint(0x1f5d3, 0xfe0f);
  const e_clock = String.fromCodePoint(0x23f0);
  const e_stadium = String.fromCodePoint(0x1f3df, 0xfe0f);
  const e_pin = String.fromCodePoint(0x1f4cd);
  const e_white = String.fromCodePoint(0x26aa);
  const e_black = String.fromCodePoint(0x26ab);

  const latestMatch = matches.length > 0 ? matches[0] : null;
  let matchHeader = `${e_soccer} *GALATICOS* ${e_dash} Squadre del ${new Date().toLocaleDateString('it-IT')}\n\n`;

  if (latestMatch) {
    const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = new Date(latestMatch.data).toLocaleDateString('it-IT', dateOptions);
    matchHeader = `${e_soccer} *GALATICOS* ${e_dash} ${matches.length}${e_ord} Giornata\n${e_cal} *${formattedDate}* - ${e_clock} *${latestMatch.ora}*\n`;
    if (latestMatch.Stadium) {
      matchHeader += `${e_stadium} Stadio: *${latestMatch.Stadium}*\n`;
      const matchCampo = dbCampi.find(c => c.nome === latestMatch.Stadium);
      if (matchCampo && matchCampo.posizione_url) {
        matchHeader += `${e_pin} Posizione: ${matchCampo.posizione_url}\n`;
      }
    }
    matchHeader += `\n`;
  }

  const isSameAsLatest =
    latestMatch && latestMatch.team_a_name === teamAName && latestMatch.team_b_name === teamBName;
  const defaultLightTeam = isSameAsLatest ? latestMatch.maglia_chiara || 'A' : 'A';
  const currentLightTeam = userOverrideMaglia || defaultLightTeam;

  const getShirtInfo = (team: 'A' | 'B') =>
    currentLightTeam === team ? `${e_white} *Maglie Chiare*` : `${e_black} *Maglie Scure*`;

  const text =
    `${matchHeader}` +
    `*${teamAName.toUpperCase()}*\n` +
    `${getShirtInfo('A')}\n` +
    results.teamA.map((n, i) => `${i + 1}. ${n}`).join('\n') +
    `\n\n*${teamBName.toUpperCase()}*\n` +
    `${getShirtInfo('B')}\n` +
    results.teamB.map((n, i) => `${i + 1}. ${n}`).join('\n') +
    `\n\nMaggiori informazioni disponibili su https://galaticos-eta.vercel.app/`;

  navigator.clipboard.writeText(text).then(() => showToast('Risultato copiato!', 'success'));
};

export const downloadFormationJpeg = async (
  pitchesElement: HTMLElement | null,
  setLoading: (loading: boolean) => void,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
) => {
  if (!pitchesElement) return;
  try {
    const htmlToImage = await import('html-to-image');
    setLoading(true);

    // 1) Nascondi le liste, header e controlli fuori campo per non averli nel layout del JPEG
    const elementsToHide = pitchesElement.querySelectorAll(
      '.team-header, .team-list, .pitch-controls-bar, .role-selector-panel'
    );
    const cards = pitchesElement.querySelectorAll('.team-card');

    elementsToHide.forEach(el => ((el as HTMLElement).style.display = 'none'));

    // 2) Togli le transizioni e l'overflow hidden che causavano il "taglio" del campo
    cards.forEach(c => {
      const el = c as HTMLElement;
      el.style.transition = 'none';
      el.style.overflow = 'visible';
      el.style.paddingBottom = '1.5rem';
    });

    // Lascia al browser il tempo di ricalcolare l'altezza senza le animazioni
    await new Promise(resolve => setTimeout(resolve, 150));

    const dataUrl = await htmlToImage.toJpeg(pitchesElement, {
      quality: 0.95,
      backgroundColor: '#0a1017',
      pixelRatio: 2,
    });

    // 3) Ripristina il layout originale
    elementsToHide.forEach(el => ((el as HTMLElement).style.display = ''));
    cards.forEach(c => {
      const el = c as HTMLElement;
      el.style.transition = '';
      el.style.overflow = '';
      el.style.paddingBottom = '';
    });

    const link = document.createElement('a');
    link.download = `formazioni_${new Date().toISOString().split('T')[0]}.jpg`;
    link.href = dataUrl;
    link.click();
    showToast('Immagine scaricata con successo', 'success');
  } catch (e) {
    console.error(e);
    showToast("Errore durante il download dell'immagine.", 'error');
  } finally {
    setLoading(false);
  }
};
