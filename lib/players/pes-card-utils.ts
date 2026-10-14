import type { Player } from '@/types';

export interface PlayerPesStats {
  isGk: boolean;
  velocita: number;
  accelerazione: number;
  tecnica: number;
  contrasto: number;
  passaggi: number;
  finalizzazione: number;
  resistenza: number;
  dribbling: number;
  rissa: number;
  altezza: number;
  peso: number;
  piede: string;
  tuffo: number;
  presa: number;
  riflessi: number;
  piazzamento: number;
  uscite: number;
  reattivita: number;
  rinvio: number;
}

export const getPlayerStats = (
  player: Player | undefined,
  fallbackName: string
): PlayerPesStats => {
  const isGk = player?.Ruolo === 'Portiere';
  if (!player && !fallbackName) {
    return {
      isGk: false,
      velocita: 50,
      accelerazione: 50,
      tecnica: 50,
      contrasto: 50,
      passaggi: 50,
      finalizzazione: 50,
      resistenza: 50,
      dribbling: 50,
      rissa: 50,
      altezza: 180,
      peso: 75,
      piede: 'Destro',
      tuffo: 50,
      presa: 50,
      riflessi: 50,
      piazzamento: 50,
      uscite: 50,
      reattivita: 50,
      rinvio: 50,
    };
  }

  let hash = 0;
  const name = player?.Nome || fallbackName;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const seed = Math.abs(hash);
  const rnd = (min: number, max: number, offset: number) =>
    Math.floor(min + ((seed + offset) % (max - min + 1)));

  if (isGk) {
    if (player?.origine_punteggi === 'MANUALE') {
      return {
        isGk: true,
        tuffo: player.tuffo ?? 0,
        presa: player.presa ?? 0,
        riflessi: player.riflessi ?? 0,
        piazzamento: player.piazzamento ?? 0,
        uscite: player.uscite ?? 0,
        reattivita: player.reattivita ?? 0,
        rinvio: player.rinvio ?? 0,
        resistenza: player.resistenza ?? 0,
        rissa: player.rissa ?? 0,
        altezza: player.altezza ?? 0,
        peso: player.peso ?? 0,
        piede: player.piede ?? 'ND',
        velocita: player.tuffo ?? 0,
        accelerazione: player.presa ?? 0,
        tecnica: player.riflessi ?? 0,
        contrasto: player.piazzamento ?? 0,
        passaggi: player.uscite ?? 0,
        finalizzazione: player.rinvio ?? 0,
        dribbling: player.reattivita ?? 0,
      };
    }

    if (player?.origine_punteggi?.toUpperCase() === 'PARZIALE') {
      return {
        isGk: true,
        tuffo: player.tuffo ?? rnd(65, 95, 1),
        presa: player.presa ?? rnd(65, 95, 2),
        riflessi: player.riflessi ?? rnd(65, 95, 3),
        piazzamento: player.piazzamento ?? rnd(65, 95, 4),
        uscite: player.uscite ?? rnd(60, 95, 5),
        reattivita: player.reattivita ?? rnd(65, 95, 6),
        rinvio: player.rinvio ?? rnd(60, 95, 7),
        resistenza: player.resistenza ?? rnd(60, 99, 9),
        rissa: player.rissa ?? rnd(30, 100, 11),
        altezza: player.altezza ?? rnd(175, 198, 8),
        peso: player.peso ?? rnd(70, 95, 12),
        piede: player.piede ?? (seed % 2 === 0 ? 'Destro' : 'Sinistro'),
        velocita: player.tuffo ?? rnd(65, 95, 1),
        accelerazione: player.presa ?? rnd(65, 95, 2),
        tecnica: player.riflessi ?? rnd(65, 95, 3),
        contrasto: player.piazzamento ?? rnd(65, 95, 4),
        passaggi: player.uscite ?? rnd(60, 95, 5),
        finalizzazione: player.rinvio ?? rnd(60, 95, 7),
        dribbling: player.reattivita ?? rnd(65, 95, 6),
      };
    }

    return {
      isGk: true,
      tuffo: rnd(65, 95, 1),
      presa: rnd(65, 95, 2),
      riflessi: rnd(65, 95, 3),
      piazzamento: rnd(65, 95, 4),
      uscite: rnd(60, 95, 5),
      reattivita: rnd(65, 95, 6),
      rinvio: rnd(60, 95, 7),
      resistenza: rnd(60, 99, 9),
      rissa: rnd(30, 100, 11),
      altezza: rnd(175, 198, 8),
      peso: rnd(70, 95, 12),
      piede: seed % 2 === 0 ? 'Destro' : 'Sinistro',
      velocita: rnd(65, 95, 1),
      accelerazione: rnd(65, 95, 2),
      tecnica: rnd(65, 95, 3),
      contrasto: rnd(65, 95, 4),
      passaggi: rnd(60, 95, 5),
      finalizzazione: rnd(60, 95, 7),
      dribbling: rnd(65, 95, 6),
    };
  }

  // Se c'è la dicitura MANUALE, prende i valori direttamente dal DB (anche se sono vuoti)
  if (player?.origine_punteggi === 'MANUALE') {
    return {
      isGk: false,
      velocita: player.velocita ?? 0,
      accelerazione: player.accelerazione ?? 0,
      tecnica: player.tecnica ?? 0,
      contrasto: player.contrasto ?? 0,
      passaggi: player.passaggi ?? 0,
      finalizzazione: player.finalizzazione ?? 0,
      resistenza: player.resistenza ?? 0,
      dribbling: player.dribbling ?? 0,
      rissa: player.rissa ?? 0,
      altezza: player.altezza ?? 0,
      peso: player.peso ?? 0,
      piede: player.piede ?? 'ND',
      tuffo: 0,
      presa: 0,
      riflessi: 0,
      piazzamento: 0,
      uscite: 0,
      reattivita: 0,
      rinvio: 0,
    };
  }

  // Se c'è la dicitura PARZIALE, prende i valori dal DB se presenti, altrimenti li genera casualmente
  if (player?.origine_punteggi?.toUpperCase() === 'PARZIALE') {
    return {
      isGk: false,
      velocita: player.velocita ?? rnd(65, 95, 1),
      accelerazione: player.accelerazione ?? rnd(65, 95, 2),
      tecnica: player.tecnica ?? rnd(65, 95, 3),
      contrasto: player.contrasto ?? rnd(50, 95, 4),
      passaggi: player.passaggi ?? rnd(65, 95, 5),
      finalizzazione: player.finalizzazione ?? rnd(55, 95, 6),
      resistenza: player.resistenza ?? rnd(60, 99, 9),
      dribbling: player.dribbling ?? rnd(65, 95, 10),
      rissa: player.rissa ?? rnd(30, 100, 11),
      altezza: player.altezza ?? rnd(165, 195, 7),
      peso: player.peso ?? rnd(60, 90, 8),
      piede: player.piede ?? (seed % 2 === 0 ? 'Destro' : 'Sinistro'),
      tuffo: rnd(50, 70, 1),
      presa: rnd(50, 70, 2),
      riflessi: rnd(50, 70, 3),
      piazzamento: rnd(50, 70, 4),
      uscite: rnd(50, 70, 5),
      reattivita: rnd(50, 70, 6),
      rinvio: rnd(50, 70, 7),
    };
  }

  return {
    isGk: false,
    velocita: rnd(65, 95, 1),
    accelerazione: rnd(65, 95, 2),
    tecnica: rnd(65, 95, 3),
    contrasto: rnd(50, 95, 4),
    passaggi: rnd(65, 95, 5),
    finalizzazione: rnd(55, 95, 6),
    resistenza: rnd(60, 99, 9),
    dribbling: rnd(65, 95, 10),
    rissa: rnd(30, 100, 11),
    altezza: rnd(165, 195, 7),
    peso: rnd(60, 90, 8),
    piede: seed % 2 === 0 ? 'Destro' : 'Sinistro',
    tuffo: rnd(50, 70, 1),
    presa: rnd(50, 70, 2),
    riflessi: rnd(50, 70, 3),
    piazzamento: rnd(50, 70, 4),
    uscite: rnd(50, 70, 5),
    reattivita: rnd(50, 70, 6),
    rinvio: rnd(50, 70, 7),
  };
};
