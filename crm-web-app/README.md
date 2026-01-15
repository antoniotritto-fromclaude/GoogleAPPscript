# CRM Antonio Tritto - Private Banking

Modern web application per la gestione clienti e acquisizione nel settore Private Banking.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-green)
![Node](https://img.shields.io/badge/Node.js-18+-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Installazione Rapida

### Opzione 1: Installazione Locale (Consigliata per iniziare)

**Windows:**
```batch
# Doppio click su install.bat
# oppure dal terminale:
install.bat
```

**Mac/Linux:**
```bash
chmod +x install.sh
./install.sh
```

**Manuale:**
```bash
npm install
npm run seed
npm start
```

Apri il browser su **http://localhost:3000**

---

### Opzione 2: Docker (Per server/produzione)

```bash
# Avvio con Docker Compose (consigliato)
docker-compose up -d

# Oppure build manuale
docker build -t crm-antonio-tritto .
docker run -d -p 3000:3000 -v crm-data:/app/data crm-antonio-tritto
```

---

## 🌐 Deploy su Web (Hosting Pubblico)

### Railway (Gratis, più semplice)

1. Vai su [railway.app](https://railway.app)
2. Clicca "New Project" → "Deploy from GitHub repo"
3. Seleziona questo repository
4. Railway rileverà automaticamente Node.js e avvierà l'app
5. Ottieni un URL pubblico tipo `crm-xxx.up.railway.app`

### Render (Gratis)

1. Vai su [render.com](https://render.com)
2. Crea un "New Web Service"
3. Connetti il repository GitHub
4. Configura:
   - Build Command: `npm install && npm run seed`
   - Start Command: `npm start`
5. Ottieni URL pubblico

### Heroku

```bash
# Installa Heroku CLI e fai login
heroku login
heroku create crm-antonio-tritto
git push heroku main
heroku open
```

### VPS (DigitalOcean, Linode, ecc.)

```bash
# Sul server
git clone <repo-url>
cd crm-web-app
npm install
npm run seed

# Avvia con PM2 per mantenerlo attivo
npm install -g pm2
pm2 start src/server.js --name crm
pm2 save
pm2 startup
```

---

## 📱 Caratteristiche

- **Dashboard Interattiva**: KPI in tempo reale, grafici e alert
- **Gestione Contatti**: Database completo con categorizzazione e scoring
- **Sales Pipeline**: Funnel visivo con gestione stage e probabilità
- **Gestione Contratti**: Lifecycle completo dalla bozza all'attivazione
- **AUM Tracking**: Monitoraggio patrimonio gestito con trend
- **Chiamate & Follow-up**: Registro chiamate con reminder automatici
- **Analytics**: Report avanzati su canali, conversioni e velocity

---

## 🛠 Stack Tecnologico

| Componente | Tecnologia |
|------------|------------|
| Backend | Node.js + Express.js |
| Database | SQLite (better-sqlite3) |
| Frontend | HTML5, CSS3 (Dark Theme), JavaScript |
| Charts | Chart.js |
| Icons | Bootstrap Icons |

---

## 📁 Struttura Progetto

```
crm-web-app/
├── data/               # Database SQLite
├── public/             # Frontend statico
│   ├── css/           # Stili CSS
│   ├── js/            # JavaScript frontend
│   └── index.html     # Dashboard principale
├── src/
│   ├── models/        # Schema database
│   ├── routes/        # API REST endpoints
│   ├── scripts/       # Script utility
│   └── server.js      # Entry point server
├── Dockerfile         # Per container Docker
├── docker-compose.yml # Avvio semplificato
├── install.sh         # Script installazione Linux/Mac
├── install.bat        # Script installazione Windows
└── README.md
```

---

## 🔌 API Endpoints

### Dashboard
- `GET /api/dashboard` - KPI e statistiche
- `GET /api/dashboard/alerts` - Alert attivi

### Contatti
- `GET /api/contatti` - Lista (con filtri)
- `POST /api/contatti` - Crea
- `PUT /api/contatti/:id` - Aggiorna
- `DELETE /api/contatti/:id` - Elimina

### Pipeline
- `GET /api/pipeline` - Lista deal
- `GET /api/pipeline/funnel` - Dati funnel
- `POST /api/pipeline` - Crea deal
- `PUT /api/pipeline/:id` - Aggiorna

### Contratti
- `GET /api/contratti` - Lista
- `POST /api/contratti` - Crea
- `POST /api/contratti/:id/firma` - Firma

### AUM
- `GET /api/aum/summary` - Riepilogo
- `POST /api/aum` - Registra operazione

### Chiamate
- `GET /api/chiamate/oggi` - Follow-up da fare
- `POST /api/chiamate` - Registra chiamata

### Analytics
- `GET /api/analytics/overview` - Overview KPI
- `GET /api/analytics/canali` - Performance canali

---

## ❓ Risoluzione Problemi

**Errore "node not found":**
- Installa Node.js da https://nodejs.org (versione 18+)

**Errore "better-sqlite3":**
```bash
# Su Linux
sudo apt install build-essential python3

# Su Mac
xcode-select --install
```

**Porta 3000 occupata:**
```bash
# Usa una porta diversa
PORT=8080 npm start
```

---

## 📄 Licenza

MIT - Antonio Tritto

---

## 🔄 Migrazione da Google Sheets

Questa applicazione sostituisce il sistema CRM basato su Google Apps Script, offrendo:

✅ Performance 10-100x più veloci
✅ Interfaccia moderna e responsive
✅ API RESTful per integrazioni
✅ Database locale (nessuna dipendenza Google)
✅ Grafici interattivi avanzati
✅ Facile deployment su qualsiasi hosting
