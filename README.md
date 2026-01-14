# 🎯 CRM Ecosistema Acquisizione Clienti - Sistema Completo Automatizzato

**by Antonio Tritto - Private Banking System**

Sistema CRM completo per Google Sheets con automazioni avanzate, gestione pipeline visuale, tracking chiamate, contratti e AUM.

---

## ✨ CARATTERISTICHE PRINCIPALI

### 📊 Gestione Completa
- ✅ **Database Contatti** con categorizzazione avanzata (Tier A+/A/B/C)
- ✅ **Pipeline Visuale** con 9 stage automatizzati e probability tracking
- ✅ **Gestione Contratti** con workflow automatico e scadenze
- ✅ **Registro AUM** con tracking operazioni e performance
- ✅ **Timeline Interazioni** completa per ogni prospect/cliente

### 📞 Automazione Chiamate & Follow-up
- ✅ Registrazione rapida chiamate dal menu
- ✅ Follow-up automatici con reminder
- ✅ Alert per chiamate scadute
- ✅ Tracking qualità call e interesse prospect

### 💰 Gestione Finanziaria
- ✅ Tracking AUM in tempo reale
- ✅ Calcolo automatico fee annue
- ✅ Performance monitoring
- ✅ ROI e CAC automatici

### 🤖 Automazioni Intelligenti
- ✅ Report giornaliero automatico (ore 8:00)
- ✅ Report settimanale (lunedì ore 9:00)
- ✅ Alert deal in stallo (>14 giorni)
- ✅ Alert contratti in scadenza (60 giorni)
- ✅ Email notifiche automatiche

### 📈 Analytics Avanzati
- ✅ KPI dashboard in tempo reale
- ✅ Conversione rates automatici
- ✅ Velocity metrics (tempo per stage)
- ✅ Performance per fonte acquisizione
- ✅ Grafici interattivi pipeline

---

## 🚀 INSTALLAZIONE E SETUP

### STEP 1: Crea Nuovo Google Sheet

1. Vai su [Google Sheets](https://sheets.google.com)
2. Crea un nuovo foglio di calcolo
3. Rinominalo "CRM Antonio Tritto" (o come preferisci)

### STEP 2: Installa il Codice

1. Nel foglio, vai su **Estensioni → Apps Script**
2. Elimina tutto il codice esistente
3. Crea 4 file (File → Nuovo → Script):
   - `Code.gs`
   - `Functions.gs`
   - `Interactive.gs`
   - `Automations.gs`

4. Copia il contenuto di ogni file dal repository in ciascun file corrispondente
5. Clicca su **Salva** (icona floppy disk)

### STEP 3: Configurazione Iniziale

1. **Modifica la tua email** in `Code.gs` alla riga 24:
   ```javascript
   EMAIL_NOTIFICHE: 'tuaemail@example.com',
   ```

2. **Autorizza lo script:**
   - Chiudi l'editor di Apps Script
   - Ricarica il foglio Google
   - Vedrai il menu "🎯 CRM Antonio Tritto" in alto
   - Clicca su: **CRM → 🚀 Setup Iniziale Completo**
   - Autorizza lo script quando richiesto

3. **Attendi il setup** (30-60 secondi)
   - Verranno creati 16 sheet interconnessi
   - Popolati con dati di esempio
   - Formattazioni e formule automatiche

### STEP 4: Attiva le Automazioni

1. Dal menu: **CRM → Automazioni → ⚙️ Attiva Tutti i Trigger**
2. Autorizza i permessi quando richiesto
3. Conferma attivazione

✅ **SETUP COMPLETATO!** Ora sei pronto per usare il CRM.

---

## 📖 GUIDA ALL'USO

### 🎯 DASHBOARD - Il Tuo Hub Centrale

**Vai su:** Sheet "DASHBOARD"

Qui trovi:
- **KPI Principali:** AUM totale, clienti, pipeline, conversioni
- **Attività Settimana:** chiamate, meeting, email, nuovi contatti
- **Pipeline per Stage:** visualizzazione grafica
- **Alert e Azioni:** cose urgenti da fare
- **Performance Mensile:** metriche del mese corrente

**Cosa fare ogni mattina:**
1. Apri DASHBOARD
2. Controlla alert rossi
3. Vedi chiamate da fare oggi
4. Controlla KPI vs target

---

### 📞 GESTIONE CHIAMATE

#### Registrare una Nuova Chiamata

1. **Menu → Gestione Chiamate → ➕ Registra Nuova Chiamata**
2. Inserisci:
   - Nome contatto
   - Telefono
   - Esito (1-5)
   - Note
3. Sistema registra automaticamente:
   - Data e ora
   - Follow-up programmato
   - Timeline interazione

#### Vedere Chiamate da Fare Oggi

1. **Menu → Gestione Chiamate → 📋 Vedi Chiamate da Fare Oggi**
2. Vedi lista completa con:
   - Nome
   - Telefono
   - Azione da fare

#### Follow-up Automatici

Il sistema imposta automaticamente:
- **Interessato:** follow-up tra 3 giorni
- **Richiamare:** follow-up tra 14 giorni
- **Appuntamento:** follow-up personalizzato

---

### 💼 GESTIONE PIPELINE

#### Visualizzare la Pipeline

1. **Menu → Gestione Pipeline → 👁️ Visualizza Pipeline Grafica**
2. Oppure: Vai direttamente su sheet "PIPELINE"

Qui puoi:
- Filtrare per Stage, Fonte, Categoria
- Ordinare per Giorni in Stage, AUM, Data
- Vedere summary in fondo

**Stage disponibili:**
1. Lead → 2. Contatto → 3. Qualificato → 4. Proposta Inviata →
5. Negoziazione → 6. Contratto Inviato → 7. Contratto Firmato → 8. Cliente Attivo

#### Avanzare un Prospect di Stage

1. **Menu → Gestione Pipeline → ⬆️ Avanza Prospect di Stage**
2. Inserisci Pipeline ID (es: P-0001)
3. Conferma avanzamento
4. Sistema aggiorna automaticamente:
   - Stage
   - Probabilità %
   - Data ingresso stage
   - Timeline

#### Chiudere un Deal (Vinto/Perso)

1. **Menu → Gestione Pipeline → ❌ Chiudi Deal**
2. Inserisci Pipeline ID
3. Scegli esito:
   - **Vinto:** inserisci AUM acquisito
   - **Perso:** inserisci motivo

**Se VINTO, sistema:**
- Aggiorna Database Contatti (→ Cliente)
- Registra AUM automaticamente
- Aggiorna statistiche
- Segna deal come "Cliente Attivo"

#### Trovare Deal in Stallo

1. **Menu → Gestione Pipeline → 🔍 Trova Prospect in Stallo**
2. Vedi lista deal fermi >14 giorni
3. Azioni consigliate per riattivare

**Indicatori visivi:**
- 🔴 **Rosso:** deal fermo >14 giorni = URGENTE
- 🟡 **Giallo:** giorni in stage normale
- 🟢 **Verde:** cliente attivo

---

### 📄 GESTIONE CONTRATTI

#### Creare un Nuovo Contratto

1. **Menu → Gestione Contratti → ➕ Crea Nuovo Contratto**
2. Inserisci:
   - Pipeline ID
   - AUM contratto
   - Tipo contratto (1-4)
3. Sistema crea contratto con:
   - ID automatico (CTR-2025-001)
   - Data creazione
   - Stato "Bozza"
   - Fee calcolate automaticamente

#### Inviare un Contratto

1. Vai su sheet "GESTIONE CONTRATTI"
2. Trova il contratto da inviare
3. Aggiorna manualmente:
   - Data Invio = oggi
   - Stato = "Inviato"
   - Email Inviata? = "SÌ"
4. Invia effettivamente il contratto via email al cliente

#### Registrare Firma Contratto

1. **Menu → Gestione Contratti → ✅ Registra Firma Contratto**
2. Inserisci Contratto ID
3. Sistema aggiorna:
   - Data Firma = oggi
   - Data Attivazione = oggi
   - Stato = "Attivo"

#### Report Contratti Pendenti

1. **Menu → Gestione Contratti → 📊 Report Contratti Pendenti**
2. Vedi:
   - Contratti inviati (in attesa)
   - Contratti in revisione
   - Contratti approvati (da firmare)

**Alert automatici:**
- 📧 Email se contratto in scadenza <60 giorni
- 🔴 Evidenziato in rosso in dashboard

---

### 💰 GESTIONE AUM

#### Registrare Nuovo AUM

1. **Menu → Gestione AUM → ➕ Registra Nuovo AUM**
2. Inserisci:
   - Cliente
   - Tipo operazione (1-4):
     - 1 = Nuova Acquisizione
     - 2 = Versamento Aggiuntivo
     - 3 = Prelievo Parziale
     - 4 = Performance Positiva/Negativa
   - Importo
3. Sistema calcola automaticamente:
   - AUM Nuovo = AUM Precedente + Variazione
   - Aggiorna Database Contatti
   - Aggiorna Dashboard

#### Report AUM Mensile

1. **Menu → Gestione AUM → 📊 Report AUM Mensile**
2. Vai su sheet "REGISTRO AUM"
3. Scroll in fondo per vedere summary:
   - AUM Totale Attuale
   - Nuove Acquisizioni mese
   - Versamenti mese
   - Prelievi mese
   - Performance mese
   - Numero Clienti Attivi

---

### 🤖 AUTOMAZIONI

#### Attivare le Automazioni

1. **Menu → Automazioni → ⚙️ Attiva Tutti i Trigger**
2. Autorizza permessi
3. Conferma attivazione

**Trigger programmati:**

| Automazione | Frequenza | Orario | Contenuto |
|-------------|-----------|---------|-----------|
| 📧 Report Giornaliero | Ogni giorno | 08:00 | Chiamate da fare, Follow-up scaduti, Alert |
| 📊 Report Settimanale | Ogni lunedì | 09:00 | Metriche settimana, Performance, AUM |
| ⚠️ Check Deal Stallo | Ogni giorno | 10:00 | Alert deal fermi >14 giorni |
| 📄 Check Contratti | Ogni giorno | 11:00 | Alert contratti in scadenza 60gg |

#### Disattivare le Automazioni

1. **Menu → Automazioni → 🛑 Disattiva Tutti i Trigger**
2. Conferma disattivazione

---

## 📊 FOGLI E LORO FUNZIONI

### 1. **DASHBOARD** 🎯
Hub centrale con KPI, attività settimana, alert, grafici pipeline

### 2. **PIPELINE** 💼
Gestione completa sales pipeline con 9 stage automatizzati

### 3. **DATABASE CONTATTI** 👥
Tutti i contatti con categorizzazione, tier, engagement score

### 4. **GESTIONE CONTRATTI** 📄
Contratti con workflow automatico, fee, scadenze

### 5. **REGISTRO AUM** 💰
Tracking operazioni AUM, versamenti, prelievi, performance

### 6. **CHIAMATE & FOLLOW-UP** 📞
Registro chiamate con esiti, qualità, follow-up programmati

### 7. **TIMELINE INTERAZIONI** 📅
Cronologia completa interazioni per ogni prospect/cliente

### 8. **ANALYTICS** 📊
KPI avanzati, metriche attività, velocity, performance per fonte

### 9. **FUNNEL GENERALE** 📈
Tracking settimanale lead, meeting, conversioni, AUM, CAC, ROI

### 10-14. **CANALI ACQUISIZIONE**
- NEWSLETTER
- COLD CALLING
- PARTNERSHIP
- TFR ENTRY
- EVENTI LIBRO
- PERCORSI FORMATIVI

### 15. **CONFIGURAZIONE** ⚙️
Liste valori, target annuali, parametri automazioni

---

## 🎯 WORKFLOW COMPLETO ESEMPIO

### Scenario: Nuovo Prospect da Cold Call a Cliente

#### 1. **CHIAMATA INIZIALE** 📞

```
Menu → Gestione Chiamate → Registra Nuova Chiamata

Input:
- Nome: Mario Rossi
- Tel: 0812345678
- Esito: 1 (Interessato)
- Note: Odontoiatra, studio con 8 dipendenti, interessato TFR

Sistema crea:
✅ Record in CHIAMATE & FOLLOW-UP
✅ Follow-up automatico tra 3 giorni
✅ Timeline interazione registrata
```

#### 2. **AGGIUNGI A DATABASE** 👥

```
Vai su: DATABASE CONTATTI
Aggiungi riga:
- Nome: Mario Rossi
- Azienda: Studio Dentistico Rossi
- Categoria: Odontoiatra
- Fonte: Cold Calling
- Tier: A (HOT)
- Engagement: 8/10
- Cliente?: NO
- Pipeline ID: P-0015
```

#### 3. **CREA DEAL IN PIPELINE** 💼

```
Vai su: PIPELINE
Aggiungi riga:
- Prospect: Mario Rossi
- Azienda: Studio Dentistico Rossi
- Fonte: Cold Calling
- Categoria: Odontoiatra
- AUM Stimato: 180.000€
- Stage: Lead → Contatto
- Next Action: Inviare materiale informativo TFR
- Data Next: tra 3 giorni
```

#### 4. **AVANZA PIPELINE** ⬆️

```
Dopo 1 settimana:
Menu → Gestione Pipeline → Avanza Prospect
Pipeline ID: P-0015
Contatto → Qualificato → Proposta Inviata → Negoziazione
```

#### 5. **CREA CONTRATTO** 📄

```
Menu → Gestione Contratti → Crea Nuovo Contratto

Input:
- Pipeline ID: P-0015
- AUM: 180.000€
- Tipo: 3 (TFR Aziendale)

Sistema crea: CTR-2025-015
```

#### 6. **FIRMA E ATTIVAZIONE** ✅

```
Menu → Gestione Contratti → Registra Firma

Contratto ID: CTR-2025-015

Sistema:
✅ Stato → Attivo
✅ Fee calcolate: 900€/anno
✅ Scadenza: 3 anni
```

#### 7. **CHIUDI DEAL** 🎉

```
Menu → Gestione Pipeline → Chiudi Deal

Pipeline ID: P-0015
Esito: SÌ (Vinto)
AUM: 180.000€

Sistema automaticamente:
✅ Pipeline → Cliente Attivo
✅ Database → Cliente? = SÌ
✅ Registro AUM → Nuova Acquisizione 180k
✅ Dashboard aggiornato
```

#### 8. **RISULTATO FINALE** 📊

```
✅ Nuovo cliente attivo
✅ AUM: 180.000€
✅ Fee annua: 900€
✅ Contratto attivo 3 anni
✅ Timeline completa registrata
✅ Report automatici aggiornati
```

---

## 📧 EMAIL AUTOMATICHE

### Report Giornaliero (ore 8:00)

```
Oggetto: 🎯 Report CRM Giornaliero - 14/01/2025

📞 Azioni di Oggi:
• Chiamate da fare: 5
• Follow-up scaduti: 2

⚠️ Alert:
• Deal in stallo (>14gg): 3
• Contratti pendenti: 2

[Link al CRM]
```

### Report Settimanale (lunedì ore 9:00)

```
Oggetto: 📊 Report CRM Settimanale - Settimana 3/2025

📈 Performance:
• Chiamate effettuate: 87
• Meeting tenuti: 15
• Nuovi contatti: 12
• Deal chiusi: 4
• AUM acquisito: €580.000

🎯 Pipeline:
• Deal attivi: 28
• Valore pipeline: €4.200.000

[Link al CRM]
```

### Alert Deal in Stallo

```
Oggetto: 🚨 Alert CRM: 3 Deal in Stallo

Trovati 3 deal fermi da più di 14 giorni:

• P-0012 - Giuseppe Verdi
  Stage: Proposta Inviata (da 18 giorni)
  AUM Stimato: €150.000

• P-0023 - Laura Bianchi
  Stage: Negoziazione (da 21 giorni)
  AUM Stimato: €200.000

⚡ Azione richiesta: Riattiva questi deal!

[Link al CRM]
```

### Alert Contratti in Scadenza

```
Oggetto: 📄 Alert CRM: 2 Contratti in Scadenza

Trovati 2 contratti in scadenza nei prossimi 60 giorni:

• CTR-2025-003 - Marco Colombo
  Scade tra: 45 giorni
  AUM: €120.000
  Rinnovo Auto: SÌ

• CTR-2025-007 - Sofia Russo
  Scade tra: 58 giorni
  AUM: €180.000
  Rinnovo Auto: NO

⚡ Azione richiesta: Contatta i clienti per il rinnovo!

[Link al CRM]
```

---

## 🎨 FORMATTAZIONI E COLORI

### Tier Contatti
- 🔴 **A+ (VIP):** Rosso intenso
- 🟠 **A (HOT):** Arancione
- 🟡 **B (WARM):** Giallo
- 🟢 **C (COLD):** Verde chiaro

### Stage Pipeline
- ⚪ **Lead:** Grigio chiaro
- 🟨 **Contatto:** Giallo chiaro
- 🟧 **Qualificato:** Arancione chiaro
- 🟩 **Proposta:** Verde chiaro
- 🟩 **Negoziazione:** Verde medio
- 🟩 **Contratto Inviato:** Verde scuro
- 🟢 **Contratto Firmato:** Verde intenso
- ✅ **Cliente Attivo:** Verde forte
- 🔴 **Chiuso Perso:** Rosso chiaro

### Giorni in Stage
- ⚪ **0-7 giorni:** Normale
- 🟡 **8-13 giorni:** Warning
- 🔴 **>14 giorni:** ALERT STALLO

### Stato Contratti
- ⚪ **Bozza:** Grigio
- 🟨 **Inviato:** Giallo
- 🟧 **In Revisione:** Arancione
- 🟩 **Approvato:** Verde chiaro
- 🟢 **Firmato:** Verde
- ✅ **Attivo:** Verde forte
- 🔴 **Scaduto:** Rosso
- ⚫ **Annullato:** Grigio scuro

---

## 💡 TIPS E BEST PRACTICES

### 📅 Routine Giornaliera (15 minuti)

**Mattina ore 8:30:**
1. ✅ Apri DASHBOARD
2. ✅ Controlla email report giornaliero
3. ✅ Vedi chiamate da fare oggi
4. ✅ Controlla alert rossi
5. ✅ Prioritizza azioni urgenti

**Sera ore 18:00:**
6. ✅ Registra tutte le chiamate del giorno
7. ✅ Aggiorna pipeline (stage avanzamenti)
8. ✅ Pianifica domani

### 📊 Routine Settimanale (30 minuti)

**Lunedì mattina:**
1. ✅ Leggi report settimanale
2. ✅ Analizza conversioni vs target
3. ✅ Identifica deal in stallo
4. ✅ Pianifica settimana

**Venerdì sera:**
5. ✅ Compila FUNNEL GENERALE (riga settimana)
6. ✅ Review pipeline completa
7. ✅ Chiudi deal conclusi
8. ✅ Aggiorna note

### 🎯 KPI da Monitorare

**Quotidiani:**
- Chiamate effettuate (target: 20/giorno)
- Follow-up completati
- Deal avanzati di stage

**Settimanali:**
- Lead → Meeting % (target: 15%)
- Meeting → Cliente % (target: 20%)
- AUM acquisito

**Mensili:**
- CAC (target: 67€)
- AUM Totale vs Target
- Numero Clienti vs Target
- Tasso conversione globale

### 🚀 Come Massimizzare i Risultati

**1. CONSISTENZA**
- Registra TUTTE le chiamate (anche brevi)
- Aggiorna pipeline OGNI GIORNO
- Fai follow-up PUNTUALMENTE

**2. VELOCITÀ**
- Riduci giorni in stage
- Non lasciare deal fermi >14 giorni
- Rispondi rapidamente ai prospect

**3. QUALITÀ**
- Qualifica bene i lead (tier corretto)
- Note dettagliate ogni interazione
- Tracking sentiment accurato

**4. ANALISI**
- Review metriche ogni settimana
- Identifica bottleneck
- Ottimizza fonti migliori

---

## 🔧 PERSONALIZZAZIONE

### Modificare Target Annuali

1. Vai su sheet **CONFIGURAZIONE**
2. Sezione "TARGET ANNUALI" (righe 22-28)
3. Modifica i valori:
   - AUM Target Anno
   - Clienti Target Anno
   - Budget Marketing
   - CAC Target
   - Fee % Media

### Modificare Parametri Automazioni

1. Vai su sheet **CONFIGURAZIONE**
2. Sezione "PARAMETRI AUTOMAZIONI" (righe 34-40)
3. Modifica:
   - Email Notifiche
   - Giorni Alert Follow-up
   - Soglia Pipeline Stallo
   - Conversioni Target

### Aggiungere Nuove Fonti

1. Sheet **CONFIGURAZIONE**
2. Colonna D "FONTE"
3. Aggiungi nuove righe
4. Automaticamente disponibili in dropdown

### Aggiungere Nuove Categorie

1. Sheet **CONFIGURAZIONE**
2. Colonna A "CATEGORIA"
3. Aggiungi nuove righe
4. Automaticamente disponibili

---

## ❓ FAQ - Domande Frequenti

### Q: Come faccio a importare i miei contatti esistenti?

**A:**
1. Vai su sheet DATABASE CONTATTI
2. Copia/incolla i tuoi contatti dalla riga 2 in giù
3. Assicurati di rispettare le colonne:
   - A=ID, B=Nome, C=Azienda, etc.
4. Compila almeno: Nome, Azienda, Email, Categoria, Fonte, Tier

### Q: Posso personalizzare gli stage della pipeline?

**A:**
Sì, ma richiede modifiche al codice in `Code.gs`:
1. Modifica array stages in setupConfigurazione()
2. Modifica formula probabilità in setupPipeline()
3. Aggiorna formattazione condizionale

### Q: Le email automatiche non arrivano, perché?

**A:**
1. Verifica di aver attivato i trigger (Menu → Automazioni → Attiva)
2. Controlla autorizzazioni Apps Script
3. Verifica email in CONFIGURAZIONE!B34
4. Controlla spam/posta indesiderata

### Q: Come faccio backup del CRM?

**A:**
1. File → Crea una copia (ogni settimana)
2. File → Scarica → Foglio di calcolo (.xlsx)
3. Oppure: File → Cronologia delle versioni

### Q: Posso condividere il CRM con il mio team?

**A:**
Sì:
1. Clicca "Condividi" in alto a destra
2. Aggiungi email membri team
3. Imposta permessi (Editor per modificare)
4. Personalizza protezioni sheet se necessario

### Q: Quanto costa?

**A:**
- ✅ Google Sheets: GRATIS
- ✅ Apps Script: GRATIS
- ✅ Automazioni: GRATIS
- ✅ Tutto il sistema: COMPLETAMENTE GRATIS

### Q: Posso usarlo offline?

**A:**
Parzialmente:
- ✅ Puoi abilitare modalità offline Google Sheets
- ❌ Le automazioni email richiedono connessione
- ❌ Apps Script richiede connessione per esecuzione

### Q: È sicuro per dati sensibili?

**A:**
Sì:
- ✅ Dati su Google Cloud (sicurezza enterprise)
- ✅ Controllo completo accessi
- ✅ Cronologia versioni
- ⚠️ NON inserire password clienti
- ⚠️ GDPR: informare clienti su data storage

---

## 🐛 TROUBLESHOOTING

### Problema: "Autorizzazioni richieste"

**Soluzione:**
1. Apps Script richiede autorizzazioni per:
   - Leggere/scrivere sheet
   - Inviare email
   - Creare trigger
2. Clicca "Autorizza"
3. Seleziona il tuo account Google
4. Clicca "Consenti"

### Problema: "Errore durante setup"

**Soluzione:**
1. Verifica di aver copiato TUTTI i 4 file .gs
2. Controlla che non ci siano errori di sintassi
3. Prova: Menu → Setup Iniziale Completo di nuovo
4. Se persiste: cancella tutti gli sheet e riprova

### Problema: "Formule non funzionano"

**Soluzione:**
1. Verifica riferimenti tra sheet (nomi corretti)
2. F5 per ricaricare
3. Menu → Aggiorna Dashboard
4. SpreadsheetApp.flush() nei trigger

### Problema: "Email non inviate"

**Soluzione:**
1. Verifica quota email Gmail (100-500/giorno)
2. Controlla autorizzazioni MailApp
3. Verifica formato email in CONFIG
4. Test: invia email manualmente da Apps Script

### Problema: "Dati esempio non popolati"

**Soluzione:**
1. Menu → Rigenera Dati Esempio
2. Oppure: esegui popolaDatiEsempioCompleti() da Apps Script
3. Attendi 30-60 secondi

---

## 📞 SUPPORTO E CONTATTI

### Hai bisogno di aiuto?

📧 **Email:** antonio@antoniotritto.com

### Vuoi personalizzazioni avanzate?

💼 **Consulenza disponibile per:**
- Personalizzazione workflow specifici
- Integrazione con altri sistemi (Zapier, Make, API)
- Training team
- Setup per grandi organizzazioni

### Contributi e Feedback

⭐ **GitHub:** [Repository Link]
🐛 **Bug Reports:** [Issues Link]
💡 **Feature Requests:** [Discussions Link]

---

## 📜 LICENZA E CREDITS

**Sviluppato da:** Antonio Tritto
**Versione:** 1.0.0
**Data Rilascio:** Gennaio 2025
**Licenza:** MIT License

---

## 🚀 CHANGELOG

### v1.0.0 (Gennaio 2025)
- ✅ Release iniziale
- ✅ 16 sheet interconnessi
- ✅ Menu interattivo completo
- ✅ Automazioni email
- ✅ Grafici pipeline
- ✅ Dati esempio inclusi
- ✅ Documentazione completa

---

**🎯 Inizia subito a usare il CRM e trasforma il tuo processo di acquisizione clienti!**

**Per qualsiasi domanda o supporto, contattami a: antonio@antoniotritto.com**

---

*Made with ❤️ for financial advisors and private banking professionals*
