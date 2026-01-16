/**
 * Database SQLite con sql.js (puro JavaScript, no compilazione nativa)
 * CRM Antonio Tritto - Private Banking
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/crm.db');
const dataDir = path.join(__dirname, '../../data');

let database = null;
let SQL = null;
let isInitialized = false;

// Assicura che la directory data esista
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Salva il database su file
function saveDatabase() {
  if (database) {
    const data = database.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Salva periodicamente
let pendingSave = false;
function scheduleSave() {
  if (!pendingSave) {
    pendingSave = true;
    setTimeout(() => {
      saveDatabase();
      pendingSave = false;
    }, 500);
  }
}

// Wrapper per statement - compatibile con API better-sqlite3
class StatementWrapper {
  constructor(sqlText) {
    this.sqlText = sqlText;
  }

  run(...params) {
    try {
      database.run(this.sqlText, params);
      scheduleSave();
      const lastId = database.exec("SELECT last_insert_rowid() as id");
      return {
        changes: database.getRowsModified(),
        lastInsertRowid: lastId[0]?.values[0]?.[0] || 0
      };
    } catch (e) {
      console.error('SQL run Error:', e.message, '\nSQL:', this.sqlText, '\nParams:', params);
      throw e;
    }
  }

  get(...params) {
    try {
      const stmt = database.prepare(this.sqlText);
      if (params.length > 0) stmt.bind(params);
      if (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        const row = {};
        cols.forEach((col, i) => row[col] = vals[i]);
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    } catch (e) {
      console.error('SQL get Error:', e.message, '\nSQL:', this.sqlText);
      throw e;
    }
  }

  all(...params) {
    try {
      const results = [];
      const stmt = database.prepare(this.sqlText);
      if (params.length > 0) stmt.bind(params);
      while (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        const row = {};
        cols.forEach((col, i) => row[col] = vals[i]);
        results.push(row);
      }
      stmt.free();
      return results;
    } catch (e) {
      console.error('SQL all Error:', e.message, '\nSQL:', this.sqlText);
      throw e;
    }
  }
}

// Database wrapper con API compatibile better-sqlite3
const db = {
  prepare(sql) {
    if (!database) throw new Error('Database not initialized');
    return new StatementWrapper(sql);
  },

  exec(sql) {
    if (!database) throw new Error('Database not initialized');
    try {
      database.run(sql);
      scheduleSave();
    } catch (e) {
      console.error('SQL exec Error:', e.message);
      throw e;
    }
  },

  pragma(sql) {
    // sql.js non supporta tutti i pragma, ignora silenziosamente
  }
};

// Inizializza database (chiamato all'avvio del server)
async function initDatabase() {
  if (isInitialized) return;

  console.log('🔄 Inizializzazione sql.js...');
  SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    database = new SQL.Database(fileBuffer);
    console.log('✅ Database caricato da file');
  } else {
    database = new SQL.Database();
    console.log('✅ Nuovo database creato');
  }

  isInitialized = true;
}

// Crea le tabelle
const initializeDatabase = async () => {
  await initDatabase();

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
      categoria TEXT,
      tier TEXT DEFAULT 'C',
      fonte TEXT,
      fonte_acquisizione TEXT,
      stato_sviluppo TEXT DEFAULT 'Nuovo',
      engagement_score INTEGER DEFAULT 5,
      aum_potenziale REAL DEFAULT 0,
      is_cliente INTEGER DEFAULT 0,
      note TEXT,
      data_primo_contatto DATE,
      data_ultimo_contatto DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Aggiungi colonne se non esistono (per aggiornamento db esistente)
  try {
    db.exec(`ALTER TABLE contatti ADD COLUMN fonte_acquisizione TEXT`);
  } catch (e) { /* colonna già esiste */ }
  try {
    db.exec(`ALTER TABLE contatti ADD COLUMN stato_sviluppo TEXT DEFAULT 'Nuovo'`);
  } catch (e) { /* colonna già esiste */ }

  // Tabella Pipeline
  db.exec(`
    CREATE TABLE IF NOT EXISTS pipeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pipeline_id TEXT UNIQUE,
      contatto_id INTEGER,
      nome_deal TEXT NOT NULL,
      stage TEXT DEFAULT 'Lead',
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
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      tipo_contratto TEXT,
      aum REAL DEFAULT 0,
      fee_percentuale REAL DEFAULT 0.5,
      fee_annuale REAL DEFAULT 0,
      stato TEXT DEFAULT 'Bozza',
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
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabella Registro AUM
  db.exec(`
    CREATE TABLE IF NOT EXISTS registro_aum (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contatto_id INTEGER,
      contratto_id INTEGER,
      cliente_nome TEXT NOT NULL,
      tipo_operazione TEXT,
      aum_precedente REAL DEFAULT 0,
      variazione REAL DEFAULT 0,
      aum_nuovo REAL DEFAULT 0,
      performance_percentuale REAL DEFAULT 0,
      data_operazione DATE DEFAULT CURRENT_DATE,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      tipo_chiamata TEXT,
      esito TEXT,
      qualita TEXT,
      livello_interesse TEXT,
      durata_minuti INTEGER DEFAULT 0,
      data_chiamata DATE DEFAULT CURRENT_DATE,
      ora_chiamata TIME,
      data_follow_up DATE,
      follow_up_completato INTEGER DEFAULT 0,
      note TEXT,
      prossimi_passi TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabella Timeline Interazioni
  db.exec(`
    CREATE TABLE IF NOT EXISTS timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contatto_id INTEGER,
      pipeline_id INTEGER,
      tipo_interazione TEXT,
      canale TEXT,
      descrizione TEXT,
      sentiment TEXT,
      stage_prima TEXT,
      stage_dopo TEXT,
      cambio_stage INTEGER DEFAULT 0,
      documento_url TEXT,
      data_interazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabella Interazioni/Touchpoints - Tracciamento dettagliato percorso contatto
  db.exec(`
    CREATE TABLE IF NOT EXISTS interazioni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contatto_id INTEGER NOT NULL,
      pipeline_id INTEGER,
      chiamata_id INTEGER,
      tipo TEXT NOT NULL,
      canale TEXT,
      oggetto TEXT,
      descrizione TEXT,
      esito TEXT,
      data_interazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_prossima_azione DATE,
      prossima_azione TEXT,
      funnel_assegnato TEXT,
      email_numero INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contatto_id) REFERENCES contatti(id)
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

  saveDatabase();
  console.log('✅ Tabelle database create');
};

module.exports = { db, initializeDatabase, initDatabase, saveDatabase };
