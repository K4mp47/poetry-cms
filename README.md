# Digital Silence - CMS con GitHub come Database

Un portfolio letterario con CMS integrato che utilizza **GitHub come database** per la persistenza dei contenuti.

## 🎯 Concetto

Questo progetto implementa un'architettura "serverless" dove:
- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Database**: File JSON nella repository GitHub (accessibili via GitHub API)
- **Hosting**: Netlify (connesso alla repository GitHub)
- **CMS**: Interfaccia di amministrazione integrata con autenticazione

## 🚀 Deploy su Netlify

### 1. Crea una repository GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/digital-silence.git
git push -u origin main
```

### 2. Configura Netlify

1. Vai su [netlify.com](https://netlify.com) e accedi
2. Clicca "Add new site" → "Import an existing project"
3. Seleziona GitHub e autorizza Netlify
4. Scegli la repository del progetto
5. Configura le impostazioni:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Clicca "Deploy site"

### 3. Configura le Environment Variables

Nel pannello di Netlify, vai su **Site settings** → **Environment variables** e aggiungi:

| Variable | Descrizione | Esempio |
|----------|-------------|---------|
| `VITE_GITHUB_TOKEN` | Token GitHub con permessi repo | `ghp_xxxxxxxxxxxx` |
| `VITE_GITHUB_REPO` | Nome repository (owner/repo) | `username/digital-silence` |
| `VITE_GITHUB_BRANCH` | Branch dove salvare i contenuti | `main` |
| `VITE_CONTENT_PATH` | Percorso cartella contenuti | `content` |
| `VITE_ADMIN_PASSWORD` | Password per accedere al CMS | `tua_password_sicura` |

### 4. Crea un GitHub Token

1. Vai su GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Clicca "Generate new token (classic)"
3. Seleziona lo scope `repo` (full control of private repositories)
4. Copia il token e incollalo in `VITE_GITHUB_TOKEN` su Netlify

## 📁 Struttura del Progetto

```
├── content/                    # Database JSON (file di contenuto)
│   ├── settings.json          # Impostazioni del sito
│   ├── meta.json              # Ordine dei contenuti
│   ├── story-*.json           # Storie
│   ├── poem-*.json            # Poesie
│   └── quote-*.json           # Citazioni
├── src/
│   ├── components/
│   │   ├── CMS.tsx            # Interfaccia CMS
│   │   └── Login.tsx          # Login per CMS
│   ├── hooks/
│   │   ├── useGitHubDB.ts     # Hook per GitHub API
│   │   └── useAuth.ts         # Hook per autenticazione
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── App.tsx                # Componente principale
│   └── index.css              # Stili
├── dist/                       # Build output (deploy su Netlify)
└── vite.config.ts             # Configurazione Vite
```

## 🔧 Funzionalità CMS

### Aggiungere Contenuti
1. Accedi al CMS cliccando "CMS" nel menu
2. Inserisci la password (default: `jacopo` o quella configurata in `VITE_ADMIN_PASSWORD`)
3. Clicca "+ New Post"
4. Compila il form:
   - **Type**: Story, Poetry, o Quote
   - **Title**: Titolo (non richiesto per Quote)
   - **Date**: Data di pubblicazione
   - **Excerpt**: Anteprima (non richiesto per Quote)
   - **Body**: Contenuto completo
5. Clicca "Save"

### Modificare Contenuti
1. Nel CMS, trova il contenuto nella lista
2. Clicca "Edit"
3. Modifica i campi
4. Clicca "Save"

### Cancellare Contenuti
1. Nel CMS, trova il contenuto nella lista
2. Clicca "Delete"
3. Conferma l'eliminazione

### Modificare Impostazioni
1. Nel CMS, clicca sulla tab "Site Settings"
2. Modifica:
   - Site Title
   - Site Description
   - Author Name
   - Author Bio
   - Author Roles
3. Clicca "Save Settings"

## 🔄 Come funziona il Database GitHub

### Lettura
1. L'app carica i file JSON dalla cartella `content/`
2. Se GitHub è configurato, usa l'API GitHub per leggere i file
3. Altrimenti, legge i file statici dalla build

### Scrittura
1. Quando salvi un contenuto nel CMS:
   - Se GitHub è configurato: chiama l'API GitHub per creare/aggiornare il file
   - Se GitHub NON è configurato: salva solo in localStorage (modalità offline)
2. Il file JSON viene codificato in base64 e inviato a GitHub
3. GitHub crea un commit automatico nella repository

### Struttura dei file JSON

**settings.json:**
```json
{
  "siteTitle": "Digital Silence",
  "siteDescription": "A collection of stories...",
  "authorName": "Jacopo",
  "authorBio": "Obsessed with the silence...",
  "authorRoles": ["Author", "Curator", "Dreamer"]
}
```

**story/poem/quote-*.json:**
```json
{
  "id": "1",
  "type": "Story",
  "title": "Titolo",
  "excerpt": "Anteprima...",
  "body": "Contenuto completo...",
  "date": "Oct 24, 2023"
}
```

**meta.json:**
```json
{
  "contentOrder": ["1", "2", "3"]
}
```

## 🛡️ Sicurezza

- **Autenticazione**: Password-based con lockout dopo 3 tentativi falliti
- **GitHub Token**: Memorizzato solo come environment variable su Netlify
- **Sessione**: Mantenuta in sessionStorage (si perde alla chiusura del browser)

## 📝 Note

- In **modalità locale** (senza GitHub configurato), i cambiamenti sono salvati solo nel browser
- Per persistere i cambiamenti, configura le environment variables GitHub su Netlify
- Ogni modifica nel CMS crea un commit nella repository GitHub
- Il sito si ricarica automaticamente quando Netlify rileva i cambiamenti nella repository

## 🎨 Personalizzazione

### Cambiare i colori
Modifica le variabili CSS in `src/index.css`:

```css
:root {
  --color-paper: #F7F5F0;    /* Sfondo */
  --color-dark: #1A1A1A;      /* Testo */
  --color-accent: #A7D4DE;    /* Accento */
  --color-muted: #6B6B6B;     /* Testo secondario */
}
```

### Cambiare il font
Aggiungi il font in `index.html` e modifica in `src/index.css`:

```css
.font-serif {
  font-family: 'Il Tuo Font', serif;
}
```

## 📚 Credits

Ispirato al video: [Host your Database for Free on Github Pages](https://youtu.be/cYP0k_shdWc)
