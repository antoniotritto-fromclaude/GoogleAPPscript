# CRM Antonio Tritto - Private Banking

Modern web application per la gestione clienti e acquisizione nel settore Private Banking.

## Caratteristiche

- **Dashboard Interattiva**: KPI in tempo reale, grafici e alert
- **Gestione Contatti**: Database completo con categorizzazione e scoring
- **Sales Pipeline**: Funnel visivo con gestione stage e probabilità
- **Gestione Contratti**: Lifecycle completo dalla bozza all'attivazione
- **AUM Tracking**: Monitoraggio patrimonio gestito con trend
- **Chiamate & Follow-up**: Registro chiamate con reminder automatici
- **Analytics**: Report avanzati su canali, conversioni e velocity

## Stack Tecnologico

- **Backend**: Node.js + Express.js
- **Database**: SQLite (better-sqlite3)
- **Frontend**: HTML5, CSS3 (Dark Theme), JavaScript
- **Charts**: Chart.js
- **UI Icons**: Bootstrap Icons

## Installazione

```bash
# Installa dipendenze
npm install

# Inizializza database con dati esempio
npm run seed

# Avvia server
npm start
```

Il server sarà disponibile su `http://localhost:3000`

## Scripts Disponibili

- `npm start` - Avvia il server in produzione
- `npm run dev` - Avvia con watch mode (sviluppo)
- `npm run init-db` - Inizializza solo il database
- `npm run seed` - Popola database con dati esempio

## Struttura Progetto

```
crm-web-app/
├── data/               # Database SQLite
├── public/             # Frontend statico
│   ├── css/           # Stili CSS
│   ├── js/            # JavaScript frontend
│   └── index.html     # Dashboard principale
└── src/
    ├── models/        # Schema database
    ├── routes/        # API REST endpoints
    ├── scripts/       # Script utility
    └── server.js      # Entry point server
```

## API Endpoints

### Dashboard
- `GET /api/dashboard` - KPI e statistiche principali
- `GET /api/dashboard/alerts` - Alert attivi
- `GET /api/dashboard/performance` - Performance agenti

### Contatti
- `GET /api/contatti` - Lista contatti (con filtri)
- `GET /api/contatti/:id` - Dettaglio contatto
- `POST /api/contatti` - Crea contatto
- `PUT /api/contatti/:id` - Aggiorna contatto
- `DELETE /api/contatti/:id` - Elimina contatto

### Pipeline
- `GET /api/pipeline` - Lista deal
- `GET /api/pipeline/funnel` - Dati funnel
- `POST /api/pipeline` - Crea deal
- `PUT /api/pipeline/:id` - Aggiorna deal
- `POST /api/pipeline/:id/avanza` - Avanza stage

### Contratti
- `GET /api/contratti` - Lista contratti
- `GET /api/contratti/stats` - Statistiche
- `POST /api/contratti` - Crea contratto
- `POST /api/contratti/:id/firma` - Registra firma

### AUM
- `GET /api/aum` - Lista operazioni
- `GET /api/aum/summary` - Riepilogo AUM
- `POST /api/aum` - Registra operazione

### Chiamate
- `GET /api/chiamate` - Lista chiamate
- `GET /api/chiamate/oggi` - Follow-up da fare
- `POST /api/chiamate` - Registra chiamata

### Analytics
- `GET /api/analytics/overview` - Overview KPI
- `GET /api/analytics/funnel` - Analisi funnel
- `GET /api/analytics/canali` - Performance canali
- `GET /api/analytics/clienti` - Analisi clienti

## Migrazione da Google Sheets

Questa applicazione sostituisce il sistema CRM basato su Google Apps Script, offrendo:

- Performance 10x più veloci grazie a SQLite
- Interfaccia moderna e responsive
- API RESTful per integrazioni
- Grafici interattivi avanzati
- Nessuna dipendenza da Google Services

## Licenza

MIT - Antonio Tritto
