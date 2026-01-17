/**
 * Email API Routes
 * Gestione invio email tramite Gmail SMTP
 *
 * LIMITI GOOGLE GMAIL:
 * - 500 email/giorno per account Gmail normale
 * - 2000 email/giorno per Google Workspace
 * - Delay consigliato: 2-3 secondi tra ogni email per evitare spam
 */

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { db, saveDatabase } = require('../models/database');

// Variabili per gestire lo stato dell'invio bulk
let bulkEmailStatus = {
  inProgress: false,
  total: 0,
  sent: 0,
  failed: 0,
  errors: []
};

// Template email predefiniti
const emailTemplates = {
  presentazione: {
    nome: 'Presentazione Servizi',
    oggetto: 'Opportunità di Consulenza Finanziaria Personalizzata',
    corpo: `Gentile {{nome}},

Mi permetto di contattarLa per presentarLe i nostri servizi di consulenza finanziaria personalizzata.

In qualità di Private Banker, offro:
- Gestione patrimoniale su misura
- Pianificazione finanziaria a lungo termine
- Ottimizzazione fiscale degli investimenti
- Protezione e trasmissione del patrimonio

Sarei lieto di fissare un incontro conoscitivo, senza alcun impegno, per illustrarLe come potremmo collaborare per raggiungere i Suoi obiettivi finanziari.

Rimango a disposizione per qualsiasi chiarimento.

Cordiali saluti,
Antonio Tritto
Private Banker`
  },
  followup: {
    nome: 'Follow-up',
    oggetto: 'Seguito al nostro contatto',
    corpo: `Gentile {{nome}},

Faccio seguito al nostro recente contatto per verificare se ha avuto modo di valutare la nostra proposta.

Resto a disposizione per rispondere a qualsiasi domanda o per fissare un appuntamento nel momento a Lei più comodo.

Cordiali saluti,
Antonio Tritto
Private Banker`
  },
  invito_evento: {
    nome: 'Invito Evento',
    oggetto: 'Invito esclusivo: {{evento}}',
    corpo: `Gentile {{nome}},

Ho il piacere di invitarLa a un evento esclusivo dedicato ai nostri clienti e prospect più qualificati.

Sarà un'occasione per approfondire temi di interesse comune e conoscerci meglio.

La prego di confermare la Sua partecipazione rispondendo a questa email.

Cordiali saluti,
Antonio Tritto
Private Banker`
  }
};

// GET /api/email/templates - Lista template disponibili
router.get('/templates', (req, res) => {
  const templates = Object.entries(emailTemplates).map(([id, template]) => ({
    id,
    nome: template.nome,
    oggetto: template.oggetto,
    anteprima: template.corpo.substring(0, 100) + '...'
  }));
  res.json(templates);
});

// GET /api/email/template/:id - Singolo template
router.get('/template/:id', (req, res) => {
  const template = emailTemplates[req.params.id];
  if (!template) {
    return res.status(404).json({ error: 'Template non trovato' });
  }
  res.json({ id: req.params.id, ...template });
});

// GET /api/email/config - Recupera configurazione email (senza password)
router.get('/config', (req, res) => {
  try {
    let config = [];
    try {
      config = db.prepare(`
        SELECT chiave, valore FROM configurazione
        WHERE chiave LIKE 'email_%'
      `).all();
    } catch (e) {
      // Tabella potrebbe non esistere ancora
      console.log('Configurazione email non ancora inizializzata');
    }

    const configObj = {};
    if (config && config.length > 0) {
      config.forEach(c => {
        // Non restituire la password
        if (c.chiave !== 'email_password') {
          configObj[c.chiave.replace('email_', '')] = c.valore;
        }
      });

      // Indica se la password è configurata
      const hasPassword = config.some(c => c.chiave === 'email_password' && c.valore);
      configObj.password_configured = hasPassword;
    }

    res.json(configObj);
  } catch (error) {
    console.error('Errore config email:', error);
    res.json({}); // Ritorna oggetto vuoto invece di errore
  }
});

// POST /api/email/config - Salva configurazione email
router.post('/config', (req, res) => {
  try {
    const { email, password, nome_mittente } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Email obbligatoria' });
    }

    // Salva/aggiorna configurazione
    const upsert = (chiave, valore) => {
      try {
        const existing = db.prepare('SELECT id FROM configurazione WHERE chiave = ?').get(chiave);
        if (existing) {
          db.prepare('UPDATE configurazione SET valore = ?, updated_at = CURRENT_TIMESTAMP WHERE chiave = ?').run(valore, chiave);
        } else {
          db.prepare('INSERT INTO configurazione (chiave, valore, tipo) VALUES (?, ?, ?)').run(chiave, valore, 'string');
        }
      } catch (e) {
        console.error('Errore upsert:', e.message);
      }
    };

    upsert('email_address', email);
    if (password) {
      upsert('email_password', password);
    }
    upsert('email_nome_mittente', nome_mittente || 'Antonio Tritto');

    saveDatabase();
    res.json({ success: true, message: 'Configurazione salvata' });
  } catch (error) {
    console.error('Errore salvataggio config:', error);
    res.status(500).json({ error: 'Errore nel salvataggio: ' + error.message });
  }
});

// POST /api/email/test - Test connessione SMTP
router.post('/test', async (req, res) => {
  try {
    const config = getEmailConfig();

    if (!config.email) {
      return res.status(400).json({
        error: 'Email non configurata',
        hint: 'Inserisci l\'email Gmail e clicca "Salva Configurazione" prima di testare.'
      });
    }

    if (!config.password) {
      return res.status(400).json({
        error: 'Password non configurata',
        hint: 'Inserisci l\'App Password e clicca "Salva Configurazione" prima di testare.'
      });
    }

    const transporter = createTransporter(config);

    // Verifica connessione
    await transporter.verify();

    res.json({ success: true, message: 'Connessione Gmail riuscita!' });
  } catch (error) {
    console.error('Errore test email:', error);

    let hint = 'Verifica le credenziali e riprova.';
    if (error.message.includes('535') || error.message.includes('Username and Password not accepted')) {
      hint = 'Password errata. Assicurati di usare una App Password (16 caratteri), non la password normale di Gmail. Vai su myaccount.google.com → Sicurezza → Password per le app.';
    } else if (error.message.includes('534') || error.message.includes('less secure')) {
      hint = 'Gmail richiede una App Password. Attiva la verifica in 2 passaggi e crea una App Password.';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      hint = 'Problema di connessione di rete. Verifica la connessione internet.';
    }

    res.status(500).json({
      error: 'Connessione fallita',
      details: error.message,
      hint: hint
    });
  }
});

// POST /api/email/send - Invia singola email
router.post('/send', async (req, res) => {
  try {
    const { to, to_name, oggetto, corpo, template_id } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Destinatario obbligatorio' });
    }

    const config = getEmailConfig();
    if (!config.email || !config.password) {
      return res.status(400).json({ error: 'Configurazione email incompleta' });
    }

    let emailOggetto = oggetto;
    let emailCorpo = corpo;

    // Se è specificato un template, usalo
    if (template_id && emailTemplates[template_id]) {
      const template = emailTemplates[template_id];
      emailOggetto = emailOggetto || template.oggetto;
      emailCorpo = emailCorpo || template.corpo;
    }

    // Sostituisci placeholder
    emailOggetto = replacePlaceholders(emailOggetto, { nome: to_name });
    emailCorpo = replacePlaceholders(emailCorpo, { nome: to_name });

    const transporter = createTransporter(config);

    const result = await transporter.sendMail({
      from: `"${config.nome_mittente}" <${config.email}>`,
      to: to,
      subject: emailOggetto,
      text: emailCorpo,
      html: convertToHtml(emailCorpo)
    });

    // Registra l'invio come interazione
    try {
      const contatto = db.prepare('SELECT id FROM contatti WHERE email = ?').get(to);
      if (contatto) {
        db.prepare(`
          INSERT INTO interazioni (contatto_id, tipo, canale, oggetto, descrizione)
          VALUES (?, 'Email', 'Email', ?, 'Email inviata automaticamente')
        `).run(contatto.id, emailOggetto);
        saveDatabase();
      }
    } catch (e) {
      console.log('Nota: impossibile registrare interazione', e.message);
    }

    res.json({
      success: true,
      message: 'Email inviata con successo',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Errore invio email:', error);
    res.status(500).json({ error: 'Errore nell\'invio', details: error.message });
  }
});

// POST /api/email/send-bulk - Invia email in bulk con rate limiting
router.post('/send-bulk', async (req, res) => {
  try {
    const { contatti_ids, oggetto, corpo, template_id, delay_seconds = 3 } = req.body;

    if (!contatti_ids || contatti_ids.length === 0) {
      return res.status(400).json({ error: 'Nessun contatto selezionato' });
    }

    if (bulkEmailStatus.inProgress) {
      return res.status(400).json({ error: 'Invio bulk già in corso. Attendi il completamento.' });
    }

    const config = getEmailConfig();
    if (!config.email || !config.password) {
      return res.status(400).json({ error: 'Configurazione email incompleta' });
    }

    // Recupera contatti con email
    const placeholders = contatti_ids.map(() => '?').join(',');
    const contatti = db.prepare(`
      SELECT id, nome, cognome, email FROM contatti
      WHERE id IN (${placeholders}) AND email IS NOT NULL AND email != ''
    `).all(...contatti_ids);

    if (contatti.length === 0) {
      return res.status(400).json({ error: 'Nessun contatto con email valida' });
    }

    // Limita a 50 email per batch (sicurezza anti-spam)
    const maxBatch = 50;
    if (contatti.length > maxBatch) {
      return res.status(400).json({
        error: `Massimo ${maxBatch} email per batch. Hai selezionato ${contatti.length} contatti.`
      });
    }

    // Inizia invio asincrono
    bulkEmailStatus = {
      inProgress: true,
      total: contatti.length,
      sent: 0,
      failed: 0,
      errors: [],
      startTime: new Date()
    };

    // Risposta immediata
    res.json({
      success: true,
      message: `Invio avviato per ${contatti.length} contatti`,
      status_url: '/api/email/bulk-status'
    });

    // Processo asincrono di invio
    let emailOggetto = oggetto;
    let emailCorpo = corpo;

    if (template_id && emailTemplates[template_id]) {
      const template = emailTemplates[template_id];
      emailOggetto = emailOggetto || template.oggetto;
      emailCorpo = emailCorpo || template.corpo;
    }

    const transporter = createTransporter(config);

    for (const contatto of contatti) {
      try {
        const nomeCompleto = `${contatto.nome} ${contatto.cognome || ''}`.trim();
        const oggettoPersonalizzato = replacePlaceholders(emailOggetto, { nome: nomeCompleto });
        const corpoPersonalizzato = replacePlaceholders(emailCorpo, { nome: nomeCompleto });

        await transporter.sendMail({
          from: `"${config.nome_mittente}" <${config.email}>`,
          to: contatto.email,
          subject: oggettoPersonalizzato,
          text: corpoPersonalizzato,
          html: convertToHtml(corpoPersonalizzato)
        });

        bulkEmailStatus.sent++;

        // Registra interazione
        try {
          db.prepare(`
            INSERT INTO interazioni (contatto_id, tipo, canale, oggetto, descrizione)
            VALUES (?, 'Email', 'Email', ?, 'Email bulk inviata')
          `).run(contatto.id, oggettoPersonalizzato);
        } catch (e) {}

        // Delay tra email (anti-spam)
        if (contatti.indexOf(contatto) < contatti.length - 1) {
          await sleep(delay_seconds * 1000);
        }

      } catch (error) {
        bulkEmailStatus.failed++;
        bulkEmailStatus.errors.push({
          email: contatto.email,
          error: error.message
        });
      }
    }

    saveDatabase();
    bulkEmailStatus.inProgress = false;
    bulkEmailStatus.endTime = new Date();

  } catch (error) {
    console.error('Errore bulk email:', error);
    bulkEmailStatus.inProgress = false;
    res.status(500).json({ error: 'Errore nell\'invio bulk' });
  }
});

// GET /api/email/bulk-status - Stato invio bulk
router.get('/bulk-status', (req, res) => {
  res.json(bulkEmailStatus);
});

// POST /api/email/bulk-cancel - Annulla invio bulk (imposta flag)
router.post('/bulk-cancel', (req, res) => {
  if (bulkEmailStatus.inProgress) {
    bulkEmailStatus.cancelled = true;
    res.json({ success: true, message: 'Richiesta annullamento inviata' });
  } else {
    res.json({ success: false, message: 'Nessun invio in corso' });
  }
});

// ========== FUNZIONI HELPER ==========

function getEmailConfig() {
  try {
    const configs = db.prepare(`
      SELECT chiave, valore FROM configurazione
      WHERE chiave LIKE 'email_%'
    `).all();

    const config = {};
    configs.forEach(c => {
      config[c.chiave.replace('email_', '')] = c.valore;
    });

    return {
      email: config.address,
      password: config.password,
      nome_mittente: config.nome_mittente || 'Antonio Tritto'
    };
  } catch (e) {
    return {};
  }
}

function createTransporter(config) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.email,
      pass: config.password
    },
    // Impostazioni per evitare problemi
    pool: true,
    maxConnections: 1,
    rateDelta: 3000, // 3 secondi tra connessioni
    rateLimit: 5 // max 5 messaggi per connessione
  });
}

function replacePlaceholders(text, data) {
  if (!text) return '';
  let result = text;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'gi');
    result = result.replace(regex, data[key] || '');
  });
  return result;
}

function convertToHtml(text) {
  if (!text) return '';
  return text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = router;
