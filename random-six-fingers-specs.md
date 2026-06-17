# Specifiche Tecniche — Random Six Fingers
## Sito Web: Generatore di Squadre per Calcetto Amatoriale

---

## 1. Panoramica del Progetto

**Nome progetto:** Random Six Fingers  
**URL Vercel:** `random-six-fingers.vercel.app`  
**Repository GitHub:** `random-six-fingers` (locale → push su GitHub → deploy su Vercel)  
**Tipologia:** Single-page web application (SPA), statica — nessun backend necessario  
**Stack:** HTML5 + CSS3 + JavaScript vanilla (zero dipendenze)  
**Deploy:** Vercel (free tier, CI/CD automatico da GitHub)

---

## 2. Scopo dell'Applicazione

L'utente inserisce i nomi di **10 giocatori**, configura opzionalmente dei **cluster di vincolo**, e con un click su **"Crea Squadre"** l'app genera casualmente **2 squadre da 5 giocatori** rispettando la regola: *due giocatori dello stesso cluster non possono finire nella stessa squadra*.

---

## 3. Struttura Repository

```
random-six-fingers/
├── index.html          ← Entry point unico (SPA)
├── vercel.json         ← Configurazione Vercel (opzionale, per headers)
└── README.md           ← Documentazione progetto
```

> Nota: tutta la logica (HTML + CSS + JS) risiede in `index.html` per semplicità di deploy statico.

---

## 4. Struttura della Pagina (Layout Mobile-First)

### 4.1 Header

- Logo SVG inline del progetto (pallone da calcio stilizzato + nome "Random Six Fingers")
- Toggle dark/light mode (icona sole/luna, in alto a destra)
- Sfondo con gradiente sottile a tema verde campo da calcio

### 4.2 Sezione — Inserimento Giocatori

- **Titolo sezione:** "👥 Giocatori" (h2)
- **10 input di testo** disposti in griglia responsive:
  - Mobile: 2 colonne × 5 righe
  - Desktop: 5 colonne × 2 righe
- Ogni input ha:
  - Placeholder: `Giocatore 1`, `Giocatore 2`, ..., `Giocatore 10`
  - Larghezza: 100% della cella della griglia
  - Stato focus visibile con accent color verde
- **Validazione:** tutti e 10 i campi devono essere compilati prima di procedere; in caso contrario mostrare feedback inline sotto ogni campo vuoto

### 4.3 Sezione — Cluster di Vincolo (opzionale)

- **Titolo sezione:** "⚡ Cluster di Vincolo" (h2)
- **Sottotitolo:** "I giocatori dello stesso cluster saranno divisi in squadre diverse"
- **Lista dinamica di cluster**, inizialmente vuota
- Ogni cluster è una card che contiene:
  - **Campo nome cluster** (editabile inline), default: `Cluster A`, `Cluster B`, `Cluster C`, ...
  - **Dropdown multi-selezione** (o chip-picker) dei 10 giocatori, mostrando solo i nomi inseriti
  - **Bottone "×" rimuovi cluster** (icona, in alto a destra della card)
- **Bottone "＋ Aggiungi Cluster"** — aggiunge un nuovo cluster alla lista
- I cluster accettano **minimo 2 giocatori** ciascuno
- Un giocatore può appartenere a **un solo cluster** (validazione)

### 4.4 Pulsante Principale

- **Testo:** "⚽ Crea Squadre"
- Posizione: centrato, full-width su mobile
- Stile: grande, accent verde, shadow prominente, animazione tap/hover
- Stato disabled + messaggio tooltip se la validazione non passa

### 4.5 Sezione — Risultato (appare dopo il click)

- Appare con animazione `slide-up` + `fade-in` dopo la generazione
- Composta da **2 card squadra** affiancate su tablet/desktop, impilate su mobile
- Ogni card squadra:
  - **Nome squadra** editabile inline (click per modificare), default: `Falchi 🦅` / `Aquile 🦆`
  - Lista dei **5 giocatori assegnati** (bullet points con avatar generato da iniziali)
  - Colore accent diverso per ogni squadra (es. blu per Falchi, arancione per Aquile)
- **Bottone "🔀 Rimescola"** — rigenera le squadre con gli stessi giocatori e cluster
- **Bottone "📋 Copia"** — copia il risultato negli appunti in formato testo leggibile

---

## 5. Logica Algoritmica

### 5.1 Algoritmo di Generazione Squadre

```
INPUT:
  - players[10]: array di stringhe (nomi giocatori)
  - clusters[]: array di { name: string, members: string[] }

ALGORITMO:
  1. Shuffle players[] con Fisher-Yates algorithm
  2. Inizializza teamA[] = [], teamB[] = []
  3. Per ogni player in shuffled_players:
      a. Determina se il giocatore ha un cluster associato
      b. Se SÌ:
           - Controlla se qualche membro del suo cluster è già in teamA
           - Se SÌ in teamA → assegna a teamB (se teamB.length < 5)
           - Se SÌ in teamB → assegna a teamA (se teamA.length < 5)
           - Se nessuno → assegna alla squadra con meno membri (o random se pari)
      c. Se NO cluster:
           - Assegna alla squadra con meno membri (o random se pari)
  4. Se teamA.length != 5 || teamB.length != 5 → errore (caso impossibile, mostrare alert)
  5. RETURN { teamA, teamB }

VINCOLO HARD:
  - Due giocatori dello stesso cluster NON possono essere nella stessa squadra
  - Se il vincolo è impossibile da rispettare (es. cluster con 3+ giocatori dove
    tutti devono essere in squadre diverse ma ci sono più cluster incompatibili),
    mostrare un messaggio di errore chiaro all'utente

EDGE CASE:
  - Cluster con più di 5 membri: impossibile, validare prima del click
  - Stesso giocatore in 2 cluster diversi: non permesso, validare prima del click
```

### 5.2 Generazione Avatar da Iniziali

```javascript
// Per ogni giocatore, generare un avatar circolare SVG inline
// con le iniziali e un colore di sfondo derivato dall'hash del nome
function generateAvatar(name) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const hue = hashStringToHue(name); // 0-360
  return `<svg>...<circle fill="hsl(${hue}, 60%, 50%)"/><text>${initials}</text></svg>`;
}
```

---

## 6. Design System

### 6.1 Palette Colori

**Tema principale: calcetto, erba verde, energia sportiva**

```css
:root {
  /* Surfaces */
  --color-bg:           #0f1a0f;   /* verde scuro quasi nero */
  --color-surface:      #1a2e1a;
  --color-surface-2:    #1f361f;
  --color-border:       rgba(255,255,255,0.10);

  /* Text */
  --color-text:         #e8f5e8;
  --color-text-muted:   #8fb08f;
  --color-text-faint:   #5a7a5a;

  /* Accent Verde */
  --color-primary:      #4caf50;
  --color-primary-hover: #43a047;
  --color-primary-active: #388e3c;

  /* Squadra Falchi */
  --color-falchi:       #2196f3;   /* blu */
  --color-falchi-bg:    rgba(33, 150, 243, 0.12);

  /* Squadra Aquile */
  --color-aquile:       #ff9800;   /* arancione */
  --color-aquile-bg:    rgba(255, 152, 0, 0.12);

  /* Feedback */
  --color-error:        #ef5350;
  --color-success:      #66bb6a;
}

/* Light mode */
[data-theme="light"] {
  --color-bg:           #f1f8f1;
  --color-surface:      #ffffff;
  --color-surface-2:    #f5faf5;
  --color-border:       rgba(0,0,0,0.10);
  --color-text:         #1b2e1b;
  --color-text-muted:   #4a6a4a;
  --color-text-faint:   #8aaa8a;
  --color-primary:      #2e7d32;
  --color-primary-hover: #1b5e20;
}
```

### 6.2 Tipografia

**Font:** [Fontshare](https://www.fontshare.com/)

```html
<!-- Heading display: Clash Display (bold, sportivo) -->
<link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,600,700&display=swap" rel="stylesheet">

<!-- Body: Satoshi (leggibile, moderno) -->
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" rel="stylesheet">
```

```css
:root {
  --font-display: 'Clash Display', 'Helvetica Neue', sans-serif;
  --font-body:    'Satoshi', 'Inter', sans-serif;
}
```

### 6.3 Fluid Type Scale

```css
:root {
  --text-xs:   clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm:   clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
  --text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --text-lg:   clamp(1.125rem, 1rem + 0.75vw, 1.5rem);
  --text-xl:   clamp(1.5rem, 1.2rem + 1.25vw, 2.25rem);
}
```

### 6.4 Border Radius & Spacing

```css
:root {
  --radius-sm:   0.375rem;
  --radius-md:   0.5rem;
  --radius-lg:   0.75rem;
  --radius-xl:   1rem;
  --radius-full: 9999px;

  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-12: 3rem;    /* 48px */
}
```

---

## 7. Componenti UI Dettagliati

### 7.1 Input Giocatore

```
┌──────────────────────────┐
│ 🔴  Giocatore 1          │  ← numero + campo testo
└──────────────────────────┘
  ↑ errore: "Inserisci un nome" (se vuoto e submit)
```

- Border: `1px solid var(--color-border)`
- Focus: `box-shadow: 0 0 0 2px var(--color-primary)` + border verde
- Altezza minima: 48px (touch target)
- Padding: `var(--space-3) var(--space-4)`
- Numero giocatore come prefisso colorato (badge circolare)

### 7.2 Card Cluster

```
┌─────────────────────────────────────────┐
│  [✏️ Cluster A          ]            [×] │
│  ┌──────────────────────────────────┐   │
│  │  Seleziona giocatori...          │   │
│  └──────────────────────────────────┘   │
│  ○ Sergio  ○ Giorgio  ○ Marco           │
└─────────────────────────────────────────┘
```

- Background: `var(--color-surface-2)` con bordo `var(--color-border)`
- Nome cluster: input inline editabile, `--font-display`
- Chip-picker: giocatori come toggle pill (selezionato = accent color)
- Bordo left accent: `3px solid var(--color-primary)` solo sulla card attiva (variante)

> Nota anti-pattern: evitare `border-left` colorato come unico differenziatore visivo. Usare invece il background tinted `rgba(primary, 0.08)` + sottile border neutro.

### 7.3 Card Squadra (risultato)

```
┌─────────────────────────────────────────┐
│  🦅  [Falchi]                    ✏️      │  ← nome editabile
├─────────────────────────────────────────┤
│  🔵 SM  Sergio Marino                    │
│  🔵 GP  Giorgio Palermo                  │
│  🔵 AL  Andrea Longo                     │
│  🔵 FM  Francesco Marino                 │
│  🔵 RD  Roberto Di Naro                  │
└─────────────────────────────────────────┘
```

- Header card: `var(--color-falchi-bg)` / `var(--color-aquile-bg)`
- Avatar: cerchio 32px con iniziali, colore generato da hash del nome
- Animazione entrata: `@keyframes slideUp` + `opacity: 0 → 1`
- Nome squadra: click → `contenteditable="true"` → click fuori → salva

### 7.4 Bottone Primario "Crea Squadre"

- Background: `var(--color-primary)`, testo bianco
- Altezza: 56px, `border-radius: var(--radius-full)` (pill shape)
- Font: `--font-display`, `--text-lg`, `font-weight: 700`
- `:active` transform: `scale(0.97)` + `box-shadow` ridotto
- `:hover` background: `var(--color-primary-hover)`
- Stato disabled: `opacity: 0.5`, `cursor: not-allowed`
- Icon ⚽ a sinistra del testo

---

## 8. Responsive Breakpoints

| Breakpoint | Layout giocatori | Layout squadre | Nav |
|---|---|---|---|
| `< 480px` (mobile) | 2 col × 5 righe | 1 colonna, card impilate | Header solo logo + toggle |
| `480px – 767px` (phablet) | 2 col × 5 righe | 1 colonna, card ampie | — |
| `768px – 1023px` (tablet) | 5 col × 2 righe | 2 colonne affiancate | — |
| `≥ 1024px` (desktop) | 5 col × 2 righe | 2 colonne affiancate, card grandi | — |

---

## 9. Interazioni e Animazioni

| Evento | Animazione |
|---|---|
| Apertura sezione risultato | `slideUp 400ms ease-out` + `fadeIn 300ms` |
| Aggiunta cluster | `scaleIn 250ms spring` dalla posizione del bottone |
| Rimozione cluster | `fadeOut + slideUp 200ms` |
| Hover su card squadra | `box-shadow` aumenta (`var(--shadow-lg)`), `translateY(-2px)` |
| Click "Rimescola" | card risultato: `flash opacity 0→1` con nuovi nomi (200ms) |
| Tap input giocatore | border accent + leggero `scale(1.01)` |
| Generazione completata | shimmer sweep sulle card squadra (1 volta) |

Tutte le animazioni rispettano `@media (prefers-reduced-motion: reduce)`.

---

## 10. Validazioni e Messaggi di Errore

| Condizione | Messaggio |
|---|---|
| Meno di 10 nomi inseriti | "Inserisci tutti e 10 i nomi prima di continuare" (inline, in rosso sotto il campo vuoto) |
| Nomi duplicati | "Il nome '[nome]' è già presente" (inline sul secondo campo duplicato) |
| Cluster con meno di 2 giocatori | "Ogni cluster deve avere almeno 2 giocatori" (sotto la card cluster) |
| Stesso giocatore in due cluster | "Il giocatore '[nome]' è già assegnato a un altro cluster" |
| Cluster impossibile da rispettare (es. 6 giocatori in 1 cluster) | Toast rosso: "Impossibile rispettare tutti i vincoli. Riduci la dimensione dei cluster." |

---

## 11. Feature: Copia Risultato

Click su "📋 Copia" genera e copia questo formato nel clipboard:

```
⚽ RANDOM SIX FINGERS — Squadre del [data]

🦅 FALCHI
1. Sergio Marino
2. Giorgio Palermo
3. Andrea Longo
4. Francesco Marino
5. Roberto Di Naro

🦆 AQUILE
1. Marco Bianchi
2. Luigi Rossi
3. Antonio Verde
4. Davide Neri
5. Emanuele Blu
```

Feedback visivo post-copia: il bottone diventa `✅ Copiato!` per 2 secondi.

---

## 12. Configurazione Vercel

**`vercel.json`** (opzionale, per security headers):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

**Deploy automatico:** ogni `git push origin main` triggera un nuovo deploy su Vercel.

---

## 13. Setup Repository GitHub

```bash
# 1. Crea cartella locale
mkdir random-six-fingers && cd random-six-fingers

# 2. Init git
git init
echo "# Random Six Fingers" > README.md
git add .
git commit -m "chore: initial commit"

# 3. Crea repo su GitHub (via CLI o UI)
gh repo create random-six-fingers --public --source=. --remote=origin --push
# oppure manualmente:
# git remote add origin https://github.com/TUO_USERNAME/random-six-fingers.git
# git branch -M main
# git push -u origin main

# 4. Connetti Vercel
# → vercel.com → New Project → Import from GitHub → random-six-fingers
# → Framework Preset: Other
# → Output Directory: ./ (root)
# → Deploy
```

---

## 14. Accessibilità (WCAG AA)

- Tutti i `<input>` hanno `<label>` associata (anche visivamente nascosta con `.sr-only`)
- Focus visibile su tutti gli elementi interattivi (`:focus-visible`)
- Touch targets ≥ 44×44px
- Contrasto testo/sfondo ≥ 4.5:1 (verificato in entrambi i temi)
- Chip/toggle nei cluster hanno `role="checkbox"` + `aria-checked`
- Risultato squadre annunciato con `aria-live="polite"` per screen reader
- `alt=""` su tutti gli SVG decorativi, `aria-label` su quelli informativi

---

## 15. Checklist di Completamento

### Design System
- [ ] Design tokens CSS definiti (colori, spacing, radius, tipografia)
- [ ] Light mode + dark mode con toggle funzionante
- [ ] Font Clash Display + Satoshi caricati via Fontshare CDN
- [ ] SVG logo inline generato

### Funzionalità Core
- [ ] 10 input giocatori con validazione
- [ ] Sistema cluster dinamico (aggiungi/rimuovi/rinomina)
- [ ] Algoritmo generazione squadre con vincoli cluster
- [ ] Nomi squadre editabili inline
- [ ] Bottone Rimescola
- [ ] Bottone Copia risultato negli appunti

### UI/UX
- [ ] Layout mobile-first verificato a 375px
- [ ] Animazioni entrata risultato
- [ ] Stato empty/error per ogni sezione
- [ ] Avatar da iniziali per ogni giocatore
- [ ] Feedback visivo su ogni interazione (hover, tap, focus)

### Deploy
- [ ] Repository GitHub creato e pushato
- [ ] Progetto importato su Vercel come `random-six-fingers`
- [ ] URL `random-six-fingers.vercel.app` raggiungibile
- [ ] `vercel.json` con security headers (opzionale)
- [ ] `README.md` con istruzioni di sviluppo locale

---

*Documento generato per il progetto Random Six Fingers — Calcetto Amatoriale*
