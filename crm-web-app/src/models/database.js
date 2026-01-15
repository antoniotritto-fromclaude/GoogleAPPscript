/**
 * Database SQLite - Schema e Connessione
 * CRM Antonio Tritto - Private Banking
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/crm.db');
const db = new Database(dbPath);

// Abilita foreign keys
db.pragma('foreign_keys = ON');

// Crea le tabelle
const initializeDatabase = () => {

  // Tabella Configurazione
  db.exec(`
    CREATE TABLE IF NOT EXISTS configurazione (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chiave TEXT UNIQUE NOT NULL,
      valore TEXT,
      tipo TEXT DEFAULT 'string',
      descrizione TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabella Contatti
  db.exec(`
    CREATE TABLE IF NOT EXISTS contatti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cognome TEXT,
      azienda TEXT,
      ruolo TEXT,
      email TEXT,
      telefono TEXT,
      cellulare TEXT,
      linkedin TEXT,
      categoria TEXT CHECK(categoria IN ('Imprenditore', 'Commercialista', 'Avvocato', 'Notaio', 'Medico', 'Odontoiatra', 'Farmacista', 'Manager', 'Dirigente', 'Altro')),
      tier TEXT CHECK(tier IN ('A+', 'A', 'B', 'C')) DEFAULT 'C',
      fonte TEXT,
      engagement_score INTEGER DEFAULT 5 CHECK(engagement_score BETWEEN 1 AND 10),
      aum_potenziale REAL DEFAULT 0,
      is_cliente INTEGER DEFAULT 0,
      note TEXT,
      data_primo_contatto DATE,
      data_ultimo_contatto DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabella Pipeline
  db.exec(`
    CREATE TABLE IF NOT EXISTS pipeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pipeline_id TEXT UNIQUE,
      contatto_id INTEGER,
      nome_deal TEXT NOT NULL,
      stage TEXT CHECK(stage IN ('Lead', 'Contatto', 'Qualificato', 'Proposta Inviata', 'Negoziazione', 'Contratto Inviato', 'Contratto Firmato', 'Cliente Attivo', 'Chiuso Perso')) DEFAULT 'Lead',
      aum_previsto REAL DEFAULT 0,
      probabilita INTEGER DEFAULT 10,
      fee_percentuale REAL DEFAULT 0.5,
      fee_stimata REAL DEFAULT 0,
      fonte TEXT,
      data_creazione DATE DEFAULT CURRENT_DATE,
      data_ultimo_avanzamento DATE DEFAULT CURRENT_DATE,
      giorni_in_stage INTEGER DEFAULT 0,
      motivo_perdita TEXT,
      note TEXT,
      responsabile TEXT DEFAULT 'Antonio Tritto',
      prossima_azione TEXT,
      data_prossima_azione DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contatto_id) REFERENCES contatti(id) ON DELETE SET NULL
    )
  `);

  // Tabella Contratti
  db.exec(`
    CREATE TABLE IF NOT EXISTS contratti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contratto_id TEXT UNIQUE,
      pipeline_id INTEGER,
      contatto_id INTEGER,
      cliente_nome TEXT NOT NULL,
      tipo_contratto TEXT CHECK(tipo_contratto IN ('Gestione Patrimonio', 'Consulenza Finanziaria', 'TFR Aziendale', 'Piano Pensionistico', 'Polizza Vita', 'Investimenti', 'Advisory', 'Altro')),
      aum REAL DEFAULT 0,
      fee_percentuale REAL DEFAULT 0.5,
      fee_annuale REAL DEFAULT 0,
      stato TEXT CHECK(stato IN ('Bozza', 'Inviato', 'In Revisione', 'Approvato', 'Firmato', 'Attivo', 'Scaduto', 'Annullato', 'Rinnovato')) DEFAULT 'Bozza',
      data_creazione DATE DEFAULT CURRENT_DATE,
      data_invio DATE,
      data_firma DATE,
      data_attivazione DATE,
      durata_mesi INTEGER DEFAULT 12,
      data_scadenza DATE,
      rinnovo_automatico INTEGER DEFAULT 1,
      documento_url TEXT,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pipeline_id) REFERENCES pipeline(id) ON DELETE SET NULL,
      FOREIGN KEY (contatto_id) REFERENCES contatti(id) ON DELETE SET NULL
    )
  `);

  // Tabella Registro AUM
  db.exec(`
    CREATE TABLE IF NOT EXISTS registro_aum (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contatto_id INTEGER,
      contratto_id INTEGER,
      cliente_nome TEXT NOT NULL,
      tipo_operazione TEXT CHECK(tipo_operazione IN ('Nuova Acquisizione', 'Versamento Aggiuntivo', 'Prelievo Parziale', 'Performance Positiva', 'Performance Negativa', 'Trasferimento In', 'Trasferimento Out', 'Chiusura Account')),
      aum_precedente REAL DEFAULT 0,
      variazione REAL DEFAULT 0,
      aum_nuovo REAL DEFAULT 0,
      performance_percentuale REAL DEFAULT 0,
      data_operazione DATE DEFAULT CURRENT_DATE,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contatto_id) REFERENCES contatti(id) ON DELETE SET NULL,
      FOREIGN KEY (contratto_id) REFERENCES contratti(id) ON DELETE SET NULL
    )
  `);

  // Tabella Chiamate e Follow-up
  db.exec(`
    CREATE TABLE IF NOT EXISTS chiamate (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chiamata_id TEXT UNIQUE,
      contatto_id INTEGER,
      pipeline_id INTEGER,
      contatto_nome TEXT NOT NULL,
      tipo_chiamata TEXT CHECK(tipo_chiamata IN ('Cold Call', 'Follow-up', 'Discovery Call', 'Presentazione', 'Negoziazione', 'Check-in Cliente', 'Supporto', 'Altro')),
      esito TEXT CHECK(esito IN ('Interessato', 'Non Interessato', 'Richiamare', 'No Risposta', 'Appuntamento Fissato', 'Info Richieste', 'Rifiuto', 'Completato')),
      qualita TEXT CHECK(qualita IN ('Ottima', 'Buona', 'Media', 'Scarsa')),
      livello_interesse TEXT CHECK(livello_interesse IN ('Alto', 'Medio', 'Basso', 'Nullo')),
      durata_minuti INTEGER DEFAULT 0,
      data_chiamata DATE DEFAULT CURRENT_DATE,
      ora_chiamata TIME,
      data_follow_up DATE,
      follow_up_completato INTEGER DEFAULT 0,
      note TEXT,
      prossimi_passi TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contatto_id) REFERENCES contatti(id) ON DELETE SET NULL,
      FOREIGN KEY (pipeline_id) REFERENCES pipeline(id) ON DELETE SET NULL
    )
  `);

  // Tabella Timeline Interazioni
  db.exec(`
    CREATE TABLE IF NOT EXISTS timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contatto_id INTEGER,
      pipeline_id INTEGER,
      tipo_interazione TEXT CHECK(tipo_interazione IN ('Chiamata', 'Email', 'Meeting', 'Video Call', 'WhatsApp', 'LinkedIn', 'Evento', 'Documento Inviato', 'Contratto', 'Nota', 'Altro')),
      canale TEXT CHECK(canale IN ('Telefono', 'Email', 'Video', 'Di Persona', 'Social Media', 'WhatsApp', 'Altro')),
      descrizione TEXT,
      sentiment TEXT CHECK(sentiment IN ('Molto Positivo', 'Positivo', 'Neutrale', 'Negativo', 'Molto Negativo')),
      stage_prima TEXT,
      stage_dopo TEXT,
      cambio_stage INTEGER DEFAULT 0,
      documento_url TEXT,
      data_interazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contatto_id) REFERENCES contatti(id) ON DELETE CASCADE,
      FOREIGN KEY (pipeline_id) REFERENCES pipeline(id) ON DELETE SET NULL
    )
  `);

  // Tabella Canali Acquisizione
  db.exec(`
    CREATE TABLE IF NOT EXISTS canali_acquisizione (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      canale TEXT NOT NULL,
      settimana TEXT,
      leads_generati INTEGER DEFAULT 0,
      contatti_qualificati INTEGER DEFAULT 0,
      clienti_acquisiti INTEGER DEFAULT 0,
      aum_acquisito REAL DEFAULT 0,
      costo REAL DEFAULT 0,
      cac REAL DEFAULT 0,
      roi_percentuale REAL DEFAULT 0,
      note TEXT,
      data_registrazione DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabella Funnel Settimanale
  db.exec(`
    CREATE TABLE IF NOT EXISTS funnel_settimanale (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settimana TEXT NOT NULL,
      anno INTEGER,
      leads_totali INTEGER DEFAULT 0,
      chiamate_effettuate INTEGER DEFAULT 0,
      meeting_fissati INTEGER DEFAULT 0,
      qualificati INTEGER DEFAULT 0,
      proposte_inviate INTEGER DEFAULT 0,
      contratti_inviati INTEGER DEFAULT 0,
      contratti_firmati INTEGER DEFAULT 0,
      clienti_attivi INTEGER DEFAULT 0,
      aum_settimanale REAL DEFAULT 0,
      fee_settimanale REAL DEFAULT 0,
      cac REAL DEFAULT 0,
      roi REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Indici per performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_contatti_tier ON contatti(tier);
    CREATE INDEX IF NOT EXISTS idx_contatti_categoria ON contatti(categoria);
    CREATE INDEX IF NOT EXISTS idx_pipeline_stage ON pipeline(stage);
    CREATE INDEX IF NOT EXISTS idx_pipeline_contatto ON pipeline(contatto_id);
    CREATE INDEX IF NOT EXISTS idx_contratti_stato ON contratti(stato);
    CREATE INDEX IF NOT EXISTS idx_chiamate_data ON chiamate(data_chiamata);
    CREATE INDEX IF NOT EXISTS idx_chiamate_follow_up ON chiamate(data_follow_up, follow_up_completato);
    CREATE INDEX IF NOT EXISTS idx_timeline_contatto ON timeline(contatto_id);
    CREATE INDEX IF NOT EXISTS idx_registro_aum_data ON registro_aum(data_operazione);
  `);

  console.log('✅ Database inizializzato con successo');
};

module.exports = { db, initializeDatabase };
