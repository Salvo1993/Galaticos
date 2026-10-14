export const parseScorersString = (scorersInput: any): Record<string, number> => {
  if (!scorersInput) return {};
  let scorersStr = '';
  if (Array.isArray(scorersInput)) {
    scorersStr = scorersInput.join(', ');
  } else if (typeof scorersInput === 'string') {
    scorersStr = scorersInput;
  } else {
    return {};
  }

  const map: Record<string, number> = {};
  scorersStr.split(/,\s*(?![^()]*\))/).forEach((s: string) => {
    const trimmed = s.trim();
    if (!trimmed) return;
    const match = trimmed.match(/^(.*?)(?:\s*\(([^)]+)\))?$/);
    if (match) {
      const name = match[1].trim();
      let count = 1;
      const content = match[2];
      if (content) {
        if (content.includes("'")) {
          count = content.split(/,|(?:' e )|(?:' )/).filter((k) => k.trim() !== '').length;
        } else {
          count = parseInt(content, 10) || 1;
        }
      }
      map[name] = (map[name] || 0) + count;
    }
  });
  return map;
};

export const stringifyScorers = (map: Record<string, number>): string => {
  return Object.entries(map)
    .filter(([_, count]) => count > 0)
    .map(([name, count]) => (count > 1 ? `${name} (${count})` : name))
    .join(', ');
};

export const getVoteColor = (v?: number | string): string => {
  if (v === 's.v.' || v === 0) return '#88929b';
  if (v === undefined || v === null) return '#88929b';
  if (typeof v === 'string') return '#88929b';
  if (v < 5) return '#e57373';
  if (v < 6) return '#f39c12';
  if (v < 7) return '#88929b';
  if (v < 8) return '#4caf50';
  if (v < 9) return '#00e676';
  return '#00ff00';
};
