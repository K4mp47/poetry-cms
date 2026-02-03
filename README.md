# Digital Silence - CMS con Firebase come Database

Un portfolio letterario con CMS integrato che utilizza **Firebase Firestore** come database per la persistenza dei contenuti.

## 🎯 Concetto

Questo progetto implementa un'architettura moderna dove:
- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Database**: Firebase Firestore (NoSQL cloud database)
- **Hosting**: Qualsiasi provider (Vercel, Netlify, Firebase Hosting, etc.)
- **CMS**: Interfaccia di amministrazione integrata con autenticazione

## 🚀 Configurazione Firebase

### 1. Crea un Progetto Firebase

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Clicca su "Aggiungi progetto" e segui i passaggi
3. Nel pannello del progetto, clicca sull'icona Web (`</>`) per registrare l'app
4. Copia le credenziali `firebaseConfig` che appariranno

### 2. Configura Authentication

1. Nel menu a sinistra, clicca su **Authentication**.
2. Vai nella scheda **Sign-in method**.
3. Clicca su **Add new provider** e seleziona **Anonymous**.
4. Attiva lo switch e clicca su **Salva**.
   *Questo è necessario perché l'app utilizza l'accesso anonimo per gestire i permessi di lettura/scrittura in modo sicuro.*

### 3. Configura Firestore Database

1. Nel menu a sinistra, clicca su **Firestore Database**.
2. Clicca su **Crea database**.
3. Scegli la posizione del server.
4. Configura le **Regole di sicurezza** (tab Rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permetti a chiunque di leggere i contenuti
    match /config/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /content/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
*Queste regole permettono a chiunque di visualizzare il sito, ma solo agli utenti "autenticati" (anche anonimamente tramite il CMS) di scrivere.*

### 3. Configura le Environment Variables

Crea un file `.env.local` nella root del progetto o aggiungi queste variabili nel pannello del tuo provider di hosting:

| Variable | Descrizione |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | La tua Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Il tuo Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Il tuo Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Il tuo Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Il tuo Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Il tuo Firebase App ID |
| `VITE_ADMIN_PASSWORD` | Password per accedere al CMS |

## 📁 Struttura del Progetto

```
├── src/
│   ├── components/
│   │   ├── CMS.tsx            # Interfaccia CMS
│   │   └── Login.tsx          # Login per CMS
│   ├── hooks/
│   │   ├── useFirebaseDB.ts   # Hook per Firebase Firestore
│   │   └── useAuth.ts         # Hook per autenticazione
│   ├── lib/
│   │   └── firebase.ts        # Configurazione Firebase SDK
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── App.tsx                # Componente principale
│   └── index.css              # Stili
└── vite.config.ts             # Configurazione Vite
```

## 🔧 Funzionalità CMS

### Aggiungere Contenuti
1. Accedi al CMS cliccando "CMS" nel menu
2. Inserisci la password (default: `jacopo` o quella configurata in `VITE_ADMIN_PASSWORD`)
3. Clicca "+ New Post"
4. Compila il form e clicca "Save"

### Struttura Database (Firestore)

Il database è organizzato in:
- **Collezione `content`**: Documenti per ogni storia, poesia o citazione. L'ID del documento è l'ID del contenuto.
- **Collezione `config`**: 
    - Documento `settings`: Contiene le impostazioni del sito.
    - Documento `meta`: Contiene l'ordine dei contenuti (`contentOrder`).

## 🛡️ Sicurezza

- **Autenticazione**: Password-based integrata nell'app.
- **Firebase Security Rules**: È consigliato configurare Firestore per permettere la scrittura solo se autenticati (utilizzando Firebase Auth o controlli custom).

## 📝 Note

- In **modalità locale** (senza Firebase configurato), i cambiamenti sono salvati solo nel browser (localStorage).
- Per persistere i cambiamenti nel cloud, assicurati che tutte le variabili `VITE_FIREBASE_*` siano correttamente configurate.

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