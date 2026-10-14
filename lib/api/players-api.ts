import type { Player } from '@/types';

export const fetchPlayersApi = async (): Promise<Player[]> => {
  const res = await fetch(`/api/giocatori?t=${Date.now()}`, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || 'Impossibile caricare i giocatori');
  return data;
};

export interface AddPlayerPayload {
  name: string;
  role: string;
  roleSecondario: string | null;
  stats: Partial<Player>;
  mergeTarget: string;
  imageFile: File | null;
}

export const addPlayerApi = async (payload: AddPlayerPayload): Promise<void> => {
  const res = await fetch('/api/giocatori', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Nome: payload.name,
      Ruolo: payload.role,
      RuoloSecondario: payload.roleSecondario,
      stats: payload.stats,
      mergeTarget: payload.mergeTarget,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  if (payload.imageFile) {
    const formData = new FormData();
    formData.append('file', payload.imageFile);
    formData.append('playerName', payload.name);
    const uploadRes = await fetch('/api/giocatori/upload-image', {
      method: 'POST',
      body: formData,
    });
    if (!uploadRes.ok) throw new Error('Errore caricamento immagine');
  }
};

export interface EditPlayerPayload {
  oldName: string;
  newName: string;
  newRole: string;
  newRoleSecondario: string | null;
  stats: Partial<Player>;
  imageFile: File | null;
}

export const updatePlayerApi = async (payload: EditPlayerPayload): Promise<void> => {
  const res = await fetch('/api/giocatori/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      oldName: payload.oldName,
      newName: payload.newName,
      newRole: payload.newRole,
      newRoleSecondario: payload.newRoleSecondario,
      stats: payload.stats,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Errore durante la modifica');

  if (payload.imageFile) {
    const formData = new FormData();
    formData.append('file', payload.imageFile);
    formData.append('playerName', payload.newName);
    const uploadRes = await fetch('/api/giocatori/upload-image', {
      method: 'POST',
      body: formData,
    });
    const uploadData = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) throw new Error(uploadData.details || 'Errore caricamento immagine');
  }
};

export const deletePlayersApi = async (names: string[]): Promise<void> => {
  if (names.length === 0) return;
  const res = await fetch('/api/giocatori/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ names }),
  });
  if (!res.ok) throw new Error('Errore nella cancellazione');
};
