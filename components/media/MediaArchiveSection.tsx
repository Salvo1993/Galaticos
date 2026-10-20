'use client';

import React, { useState } from 'react';
import { Video, ChevronDown, Plus, Upload, Medal, Copy, Pencil, Trash2 } from 'lucide-react';
import { SearchableDropdown } from '@/components/ui/Dropdowns';
import { AddMediaModal } from '@/components/media/AddMediaModal';
import BulkMediaModal from '@/components/BulkMediaModal';
import EditMediaModal from '@/components/EditMediaModal';
import { getVoteColor } from '@/lib/stats/match-utils';
import { copyPlayerMediaToClipboard } from '@/lib/export/whatsapp-share';
import type { Player, MatchResult, MediaItem } from '@/types';

export interface MediaArchiveSectionProps {
  mediaItems: MediaItem[];
  setMediaItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  matches: MatchResult[];
  dbPlayers: Player[];
  isAdmin: boolean;
  copyMatchMediaToClipboard: (match: MatchResult) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const MediaArchiveSection: React.FC<MediaArchiveSectionProps> = ({
  mediaItems,
  setMediaItems,
  matches,
  dbPlayers,
  isAdmin,
  copyMatchMediaToClipboard,
  showToast,
}) => {
  const [isMediaArchiveOpen, setIsMediaArchiveOpen] = useState(true);
  const [mediaFilterPartita, setMediaFilterPartita] = useState<string>('');
  const [mediaFilterGiocatore, setMediaFilterGiocatore] = useState<string>('');
  const [mediaFilterTipologia, setMediaFilterTipologia] = useState<string>('');

  // Modals
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);
  const [isBulkMediaModalOpen, setIsBulkMediaModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);

  const selectedMatch = mediaFilterPartita
    ? matches.find(m => m.id === Number(mediaFilterPartita))
    : null;

  const refreshMedia = async () => {
    try {
      const mediaRes = await fetch('/api/media', { cache: 'no-store' });
      const mediaData = await mediaRes.json().catch(() => []);
      setMediaItems(Array.isArray(mediaData) ? mediaData : []);
    } catch {
      // silently fail
    }
  };

  return (
    <>
      <section className="dashboard-card" id="media" style={{ marginTop: '2rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '0.5rem',
            cursor: 'pointer',
          }}
          onClick={() => {
            const nextState = !isMediaArchiveOpen;
            setIsMediaArchiveOpen(nextState);
            if (nextState && !mediaFilterPartita) {
              if (matches.length > 0) {
                const matchWithMedia = matches.find(m =>
                  mediaItems.some(media => media.partita_id === m.id)
                );
                if (matchWithMedia) {
                  setMediaFilterPartita(String(matchWithMedia.id));
                } else {
                  setMediaFilterPartita(String(matches[0].id));
                }
              }
            }
          }}
        >
          <h2 style={{ margin: 0 }}>
            <Video
              size={20}
              style={{
                verticalAlign: '-3px',
                marginRight: '0.4rem',
                color: '#3498db',
              }}
            />
            Archivio Media
          </h2>
          <ChevronDown
            size={20}
            className={`match-chevron ${isMediaArchiveOpen ? 'rotated' : ''}`}
          />
        </div>

        {isMediaArchiveOpen && (
          <div style={{ marginTop: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              <p className="section-subtitle" style={{ margin: 0 }}>
                Esplora i video delle partite. Puoi filtrare per partita, giocatore o
                tipologia.
              </p>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className="create-teams-btn"
                    style={{
                      fontSize: '0.85rem',
                      padding: '0.4rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                    onClick={() => {
                      if (!mediaFilterPartita) {
                        showToast(
                          'Seleziona prima una partita dal filtro',
                          'error'
                        );
                        return;
                      }
                      setIsAddMediaModalOpen(true);
                    }}
                  >
                    <Plus size={16} /> Aggiungi Media
                  </button>
                  <button
                    className="secondary-btn"
                    style={{
                      fontSize: '0.85rem',
                      padding: '0.4rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      borderColor: 'rgba(52, 152, 219, 0.4)',
                      background: 'rgba(52, 152, 219, 0.15)',
                      color: '#cfe8d8',
                    }}
                    onClick={() => {
                      setIsBulkMediaModalOpen(true);
                    }}
                  >
                    <Upload size={16} style={{ color: '#3498db' }} /> Carica Media in
                    Blocco (.txt / Excel)
                  </button>
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                marginBottom: '1.5rem',
                position: 'relative',
              }}
            >
              <SearchableDropdown
                value={mediaFilterPartita}
                onChange={setMediaFilterPartita}
                placeholder="Tutte le Partite"
                options={matches.map(m => ({
                  value: String(m.id),
                  label: `${new Date(m.data).toLocaleDateString('it-IT')} - ${
                    m.team_a_name
                  } vs ${m.team_b_name}`,
                }))}
              />

              <SearchableDropdown
                value={mediaFilterGiocatore}
                onChange={setMediaFilterGiocatore}
                placeholder="Tutti i Giocatori"
                options={dbPlayers.map(p => ({
                  value: p.Nome,
                  label: p.Nome,
                }))}
              />

              <SearchableDropdown
                value={mediaFilterTipologia}
                onChange={setMediaFilterTipologia}
                placeholder="Tutte le Tipologie"
                options={[
                  { value: 'Partita Completa', label: 'Partita Completa' },
                  { value: 'Sintesi', label: 'Sintesi' },
                  { value: 'Giocata', label: 'Giocata' },
                  { value: 'Epic Fail', label: 'Epic Fail' },
                  { value: 'Golazo', label: 'Golazo' },
                  { value: 'Paratona', label: 'Parata / Paratona' },
                ]}
              />
            </div>

            {mediaFilterGiocatore && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.12) 0%, rgba(18, 140, 126, 0.08) 100%)',
                  border: '1px solid rgba(37, 211, 102, 0.35)',
                  borderRadius: '10px',
                  padding: '0.7rem 1rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Video size={18} style={{ color: '#25D366', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>
                    Video di <span style={{ color: '#25D366' }}>{mediaFilterGiocatore}</span>
                    {mediaFilterPartita && selectedMatch && (
                      <span style={{ fontSize: '0.8rem', color: '#9fd9b6', marginLeft: '6px' }}>
                        ({selectedMatch.team_a_name} vs {selectedMatch.team_b_name})
                      </span>
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    copyPlayerMediaToClipboard(
                      mediaFilterGiocatore,
                      mediaItems,
                      matches,
                      showToast,
                      mediaFilterPartita,
                      mediaFilterTipologia
                    )
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#25D366',
                    border: 'none',
                    color: '#071520',
                    borderRadius: '7px',
                    padding: '0.5rem 1.1rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                  title={`Copia tutti i link WhatsApp dei video di ${mediaFilterGiocatore}`}
                >
                  <Copy size={16} />
                  <span>Copia Link Video di {mediaFilterGiocatore}</span>
                </button>
              </div>
            )}

            {selectedMatch && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(52, 152, 219, 0.2)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                    fontSize: '0.8rem',
                    color: '#6f9c81',
                  }}
                >
                  <span>{selectedMatch.Stadium || 'Campo'}</span>
                  <span>
                    {new Date(selectedMatch.data).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span>
                    {selectedMatch.ora ? selectedMatch.ora.substring(0, 5) : ''}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '1.5rem',
                    marginBottom: '0.8rem',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: '#cfe8d8',
                      textAlign: 'right',
                      flex: 1,
                    }}
                  >
                    {selectedMatch.team_a_name}
                  </span>
                  <div
                    style={{
                      background: 'rgba(52, 152, 219, 0.2)',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      color: '#3498db',
                      letterSpacing: '2px',
                    }}
                  >
                    {selectedMatch.risultato || '0 - 0'}
                  </div>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: '#cfe8d8',
                      textAlign: 'left',
                      flex: 1,
                    }}
                  >
                    {selectedMatch.team_b_name}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#9fd9b6',
                        marginBottom: '0.3rem',
                        textAlign: 'center',
                      }}
                    >
                      {selectedMatch.team_a_name}
                    </div>
                    {selectedMatch.team_a_players.map(name => {
                      const vote = selectedMatch.voti_giocatori?.[name];
                      const allVotes = Object.values(
                        selectedMatch.voti_giocatori || {}
                      ).map(v => Number(v) || 0);
                      const maxV =
                        allVotes.length > 0 ? Math.max(...allVotes) : 0;
                      const isMvp =
                        vote !== undefined && vote === maxV && maxV > 0;
                      return (
                        <div
                          key={name}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.8rem',
                            color: '#cfe8d8',
                            padding: '1px 0',
                          }}
                        >
                          <span>{name}</span>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {isMvp && (
                              <Medal size={12} style={{ color: '#FFD700' }} />
                            )}
                            <span
                              style={{
                                fontWeight: 'bold',
                                color: getVoteColor(vote),
                              }}
                            >
                              {vote ?? '-'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      width: '1px',
                      background: 'rgba(52, 152, 219, 0.2)',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#9fd9b6',
                        marginBottom: '0.3rem',
                        textAlign: 'center',
                      }}
                    >
                      {selectedMatch.team_b_name}
                    </div>
                    {selectedMatch.team_b_players.map(name => {
                      const vote = selectedMatch.voti_giocatori?.[name];
                      const allVotes = Object.values(
                        selectedMatch.voti_giocatori || {}
                      ).map(v => Number(v) || 0);
                      const maxV =
                        allVotes.length > 0 ? Math.max(...allVotes) : 0;
                      const isMvp =
                        vote !== undefined && vote === maxV && maxV > 0;
                      return (
                        <div
                          key={name}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.8rem',
                            color: '#cfe8d8',
                            padding: '1px 0',
                          }}
                        >
                          <span>{name}</span>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {isMvp && (
                              <Medal size={12} style={{ color: '#FFD700' }} />
                            )}
                            <span
                              style={{
                                fontWeight: 'bold',
                                color: getVoteColor(vote),
                              }}
                            >
                              {vote ?? '-'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '1rem',
                    borderTop: '1px solid rgba(52, 152, 219, 0.15)',
                    paddingTop: '0.75rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => copyMatchMediaToClipboard(selectedMatch)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(37, 211, 102, 0.15)',
                      border: '1px solid rgba(37, 211, 102, 0.45)',
                      color: '#25D366',
                      borderRadius: '8px',
                      padding: '0.45rem 1.2rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Copy size={15} />
                    <span>Copia Link Video</span>
                  </button>
                </div>
              </div>
            )}

            <div>
              {(() => {
                const filteredMedia = mediaItems.filter(m => {
                  if (
                    mediaFilterPartita &&
                    String(m.partita_id) !== mediaFilterPartita
                  )
                    return false;
                  if (mediaFilterTipologia) {
                    const matchTip =
                      m.tipologia === mediaFilterTipologia ||
                      (mediaFilterTipologia === 'Paratona' &&
                        m.tipologia === 'Parata') ||
                      (mediaFilterTipologia === 'Parata' &&
                        m.tipologia === 'Paratona');
                    if (!matchTip) return false;
                  }

                  if (mediaFilterGiocatore) {
                    let playerMatches = false;
                    if (
                      m.giocatore?.includes(mediaFilterGiocatore) ||
                      m.co_giocatore?.includes(mediaFilterGiocatore)
                    ) {
                      playerMatches = true;
                    } else {
                      const match = matches.find(x => x.id === m.partita_id);
                      if (match) {
                        const inTeamA = match.team_a_players?.includes(
                          mediaFilterGiocatore
                        );
                        const inTeamB = match.team_b_players?.includes(
                          mediaFilterGiocatore
                        );
                        const playedInMatch = inTeamA || inTeamB;

                        if (
                          (m.tipologia === 'Partita Completa' ||
                            m.tipologia === 'Sintesi') &&
                          playedInMatch
                        ) {
                          playerMatches = true;
                        } else if (
                          m.giocatore === match.team_a_name &&
                          inTeamA
                        )
                          playerMatches = true;
                        else if (
                          m.giocatore === match.team_b_name &&
                          inTeamB
                        )
                          playerMatches = true;
                        else if (
                          m.co_giocatore === match.team_a_name &&
                          inTeamA
                        )
                          playerMatches = true;
                        else if (
                          m.co_giocatore === match.team_b_name &&
                          inTeamB
                        )
                          playerMatches = true;
                      }
                    }

                    if (!playerMatches) return false;
                  }

                  return true;
                });

                if (filteredMedia.length === 0) {
                  return (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: '#6f9c81',
                      }}
                    >
                      Nessun video{' '}
                      {mediaFilterPartita ? 'per questa partita' : 'presente'}.
                    </div>
                  );
                }

                const renderMediaCard = (m: MediaItem, isLarge = false) => (
                  <div
                    key={m.id}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      width: '100%',
                      maxWidth: isLarge ? '800px' : 'none',
                      margin: isLarge ? '0 auto' : '0',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        paddingBottom: '56.25%',
                        height: 0,
                      }}
                    >
                      <iframe
                        src={`https://www.youtube.com/embed/${m.youtube_id}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                        }}
                      ></iframe>
                    </div>
                    <div style={{ padding: '0.8rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '0.4rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.8rem',
                            background: 'rgba(52, 152, 219, 0.2)',
                            color: '#3498db',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          {m.tipologia}
                        </span>
                        <div
                          style={{
                            display: 'flex',
                            gap: '0.4rem',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            justifyContent: 'flex-end',
                          }}
                        >
                          {m.giocatore && (
                            <span
                              style={{
                                fontSize: '0.8rem',
                                color: '#9fd9b6',
                                fontWeight: 600,
                              }}
                            >
                              {m.giocatore}
                            </span>
                          )}
                          {m.co_giocatore && (
                            <span
                              style={{ fontSize: '0.75rem', color: '#6f9c81' }}
                            >
                              & {m.co_giocatore}
                            </span>
                          )}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => setEditingMedia(m)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#f59e0b',
                                  cursor: 'pointer',
                                  padding: '0 2px',
                                  marginLeft: '4px',
                                  opacity: 0.9,
                                }}
                                title="Modifica video"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      "Eliminare questo video dall'archivio?"
                                    )
                                  )
                                    return;
                                  try {
                                    const delRes = await fetch(
                                      `/api/media?id=${m.id}`,
                                      { method: 'DELETE' }
                                    );
                                    if (delRes.ok) {
                                      showToast('Video eliminato!', 'success');
                                      setMediaItems(prev =>
                                        prev.filter(x => x.id !== m.id)
                                      );
                                    } else {
                                      showToast(
                                        'Errore eliminazione',
                                        'error'
                                      );
                                    }
                                  } catch {
                                    showToast(
                                      'Errore di connessione',
                                      'error'
                                    );
                                  }
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#e74c3c',
                                  cursor: 'pointer',
                                  padding: '0 2px',
                                  marginLeft: '3px',
                                  opacity: 0.8,
                                }}
                                title="Elimina video"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {!mediaFilterPartita && (
                        <div style={{ fontSize: '0.75rem', color: '#6f9c81' }}>
                          {(() => {
                            const match = matches.find(
                              x => x.id === m.partita_id
                            );
                            if (!match) return `Partita ID ${m.partita_id}`;
                            return `${new Date(
                              match.data
                            ).toLocaleDateString('it-IT')} - ${
                              match.team_a_name
                            } vs ${match.team_b_name}`;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );

                const partitaCompleta = filteredMedia.filter(
                  m => m.tipologia === 'Partita Completa'
                );
                const otherMedia = filteredMedia.filter(
                  m => m.tipologia !== 'Partita Completa'
                );

                const groupedMedia = otherMedia.reduce((acc, m) => {
                  if (!acc[m.tipologia]) acc[m.tipologia] = [];
                  acc[m.tipologia].push(m);
                  return acc;
                }, {} as Record<string, MediaItem[]>);

                const categoryOrder = ['Sintesi', 'Golazo', 'Paratona', 'Parata', 'Epic Fail', 'Giocata'];
                const sortedCategories = Object.keys(groupedMedia).sort(
                  (a, b) => {
                    const idxA = categoryOrder.indexOf(a);
                    const idxB = categoryOrder.indexOf(b);
                    if (idxA === -1 && idxB === -1)
                      return a.localeCompare(b);
                    if (idxA === -1) return 1;
                    if (idxB === -1) return -1;
                    return idxA - idxB;
                  }
                );

                return (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2rem',
                    }}
                  >
                    {partitaCompleta.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                          width: '100%',
                        }}
                      >
                        {partitaCompleta.map(m => renderMediaCard(m, true))}
                      </div>
                    )}

                    {sortedCategories.map(tipologia => (
                      <div
                        key={tipologia}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '1.2rem',
                            color: '#e8b339',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            paddingBottom: '0.5rem',
                          }}
                        >
                          {tipologia}
                        </h3>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '1rem',
                          }}
                        >
                          {groupedMedia[tipologia].map(m =>
                            renderMediaCard(m, false)
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </section>

      {/* Modals */}
      <AddMediaModal
        isOpen={isAddMediaModalOpen}
        onClose={() => setIsAddMediaModalOpen(false)}
        partitaId={mediaFilterPartita}
        matches={matches}
        onSuccess={refreshMedia}
        showToast={showToast}
      />

      <BulkMediaModal
        isOpen={isBulkMediaModalOpen}
        onClose={() => setIsBulkMediaModalOpen(false)}
        matches={matches}
        dbPlayers={dbPlayers}
        initialMatchId={mediaFilterPartita}
        onSuccess={async () => {
          await refreshMedia();
        }}
        showToast={showToast}
      />

      {editingMedia && (
        <EditMediaModal
          isOpen={!!editingMedia}
          media={editingMedia}
          matches={matches}
          onClose={() => setEditingMedia(null)}
          onSaveSuccess={updated => {
            setMediaItems(prev =>
              prev.map(m => (m.id === updated.id ? updated : m))
            );
          }}
          showToast={showToast}
        />
      )}
    </>
  );
};
