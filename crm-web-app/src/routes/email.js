/**
 * Email API Routes
 * Gestione invio email tramite Gmail OAuth2 o SMTP
 *
 * LIMITI GOOGLE GMAIL:
 * - 500 email/giorno per account Gmail normale
 * - 2000 email/giorno per Google Workspace
 * - Delay consigliato: 2-3 secondi tra ogni email per evitare spam
 */

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { db, saveDatabase } = require('../models/database');

// OAuth2 Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/email/oauth/callback';

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Scopes needed for sending email
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email'
];

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

// ========== OAUTH2 ROUTES ==========

// GET /api/email/oauth/url - Ottieni URL per autorizzazione Google
router.get('/oauth/url', (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(400).json({
      error: 'OAuth non configurato',
      hint: 'Configura GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nelle variabili d\'ambiente'
    });
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Forza il refresh token
  });

  res.json({ url: authUrl });
});

// GET /api/email/oauth/callback - Callback OAuth Google
router.get('/oauth/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'gmail-oauth-error', error: '${error}' }, '*');
            window.close();
          </script>
          <p>Errore: ${error}. Puoi chiudere questa finestra.</p>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Codice mancante');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Ottieni info utente
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    // Salva tokens nel database
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

    upsert('email_oauth_access_token', tokens.access_token);
    if (tokens.refresh_token) {
      upsert('email_oauth_refresh_token', tokens.refresh_token);
    }
    upsert('email_oauth_expiry', tokens.expiry_date?.toString() || '');
    upsert('email_address', email);
    upsert('email_auth_method', 'oauth2');

    saveDatabase();

    // Chiudi popup e notifica parent
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'gmail-oauth-success', email: '${email}' }, '*');
            window.close();
          </script>
          <p>Connessione riuscita! Puoi chiudere questa finestra.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Errore OAuth callback:', error);
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'gmail-oauth-error', error: 'token_error' }, '*');
            window.close();
          </script>
          <p>Errore durante l'autorizzazione. Puoi chiudere questa finestra.</p>
        </body>
      </html>
    `);
  }
});

// GET /api/email/oauth/status - Verifica stato connessione OAuth
router.get('/oauth/status', async (req, res) => {
  try {
    const config = getOAuthConfig();

    if (!config.refresh_token && !config.access_token) {
      return res.json({
        connected: false,
        method: null
      });
    }

    // Verifica se il token è valido
    oauth2Client.setCredentials({
      access_token: config.access_token,
      refresh_token: config.refresh_token
    });

    try {
      // Prova a refreshare il token
      if (config.refresh_token) {
        const { credentials } = await oauth2Client.refreshAccessToken();

        // Aggiorna token nel database
        const upsert = (chiave, valore) => {
          const existing = db.prepare('SELECT id FROM configurazione WHERE chiave = ?').get(chiave);
          if (existing) {
            db.prepare('UPDATE configurazione SET valore = ?, updated_at = CURRENT_TIMESTAMP WHERE chiave = ?').run(valore, chiave);
          } else {
            db.prepare('INSERT INTO configurazione (chiave, valore, tipo) VALUES (?, ?, ?)').run(chiave, valore, 'string');
          }
        };

        upsert('email_oauth_access_token', credentials.access_token);
        if (credentials.refresh_token) {
          upsert('email_oauth_refresh_token', credentials.refresh_token);
        }
        saveDatabase();
      }

      return res.json({
        connected: true,
        method: 'oauth2',
        email: config.email
      });
    } catch (tokenError) {
      console.error('Token refresh failed:', tokenError.message);
      return res.json({
        connected: false,
        method: null,
        error: 'Token scaduto, riconnetti Gmail'
      });
    }
  } catch (error) {
    console.error('Errore status OAuth:', error);
    res.json({ connected: false, error: error.message });
  }
});

// POST /api/email/oauth/disconnect - Disconnetti Gmail OAuth
router.post('/oauth/disconnect', (req, res) => {
  try {
    // Rimuovi tokens dal database
    db.prepare("DELETE FROM configurazione WHERE chiave LIKE 'email_oauth_%'").run();
    db.prepare("DELETE FROM configurazione WHERE chiave = 'email_auth_method'").run();
    saveDatabase();

    res.json({ success: true, message: 'Gmail disconnesso' });
  } catch (error) {
    console.error('Errore disconnect:', error);
    res.status(500).json({ error: 'Errore durante la disconnessione' });
  }
});

// ========== TEMPLATE ROUTES ==========

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

// ========== CONFIG ROUTES (SMTP legacy) ==========

// GET /api/email/config - Recupera configurazione email
router.get('/config', (req, res) => {
  try {
    let config = [];
    try {
      config = db.prepare(`
        SELECT chiave, valore FROM configurazione
        WHERE chiave LIKE 'email_%'
      `).all();
    } catch (e) {
      console.log('Configurazione email non ancora inizializzata');
    }

    const configObj = {};
    if (config && config.length > 0) {
      config.forEach(c => {
        // Non restituire password o tokens sensibili
        if (!c.chiave.includes('password') && !c.chiave.includes('token')) {
          configObj[c.chiave.replace('email_', '')] = c.valore;
        }
      });

      // Indica se configurata
      const hasPassword = config.some(c => c.chiave === 'email_password' && c.valore);
      const hasOAuth = config.some(c => c.chiave === 'email_oauth_refresh_token' && c.valore);
      configObj.password_configured = hasPassword;
      configObj.oauth_configured = hasOAuth;
      configObj.auth_method = config.find(c => c.chiave === 'email_auth_method')?.valore || (hasOAuth ? 'oauth2' : 'smtp');
    }

    res.json(configObj);
  } catch (error) {
    console.error('Errore config email:', error);
    res.json({});
  }
});

// POST /api/email/config - Salva configurazione email SMTP
router.post('/config', (req, res) => {
  try {
    const { email, password, nome_mittente } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Email obbligatoria' });
    }

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
    upsert('email_auth_method', 'smtp');

    saveDatabase();
    res.json({ success: true, message: 'Configurazione salvata' });
  } catch (error) {
    console.error('Errore salvataggio config:', error);
    res.status(500).json({ error: 'Errore nel salvataggio: ' + error.message });
  }
});

// POST /api/email/test - Test connessione
router.post('/test', async (req, res) => {
  try {
    const authMethod = getAuthMethod();

    if (authMethod === 'oauth2') {
      // Test OAuth
      const config = getOAuthConfig();
      if (!config.refresh_token) {
        return res.status(400).json({
          error: 'Gmail non connesso',
          hint: 'Clicca "Connetti Gmail" per autorizzare l\'accesso'
        });
      }

      oauth2Client.setCredentials({
        refresh_token: config.refresh_token
      });

      try {
        await oauth2Client.getAccessToken();
        res.json({ success: true, message: 'Connessione Gmail OAuth riuscita!' });
      } catch (e) {
        res.status(500).json({
          error: 'Token scaduto',
          hint: 'Riconnetti Gmail cliccando su "Connetti Gmail"'
        });
      }
    } else {
      // Test SMTP
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

      const transporter = createSmtpTransporter(config);
      await transporter.verify();
      res.json({ success: true, message: 'Connessione Gmail SMTP riuscita!' });
    }
  } catch (error) {
    console.error('Errore test email:', error);

    let hint = 'Verifica le credenziali e riprova.';
    if (error.message.includes('535') || error.message.includes('Username and Password not accepted')) {
      hint = 'Password errata. Assicurati di usare una App Password (16 caratteri), non la password normale di Gmail.';
    } else if (error.message.includes('534') || error.message.includes('less secure')) {
      hint = 'Gmail richiede una App Password. Attiva la verifica in 2 passaggi e crea una App Password.';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      hint = 'Problema di connessione di rete.';
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

    let emailOggetto = oggetto;
    let emailCorpo = corpo;

    if (template_id && emailTemplates[template_id]) {
      const template = emailTemplates[template_id];
      emailOggetto = emailOggetto || template.oggetto;
      emailCorpo = emailCorpo || template.corpo;
    }

    emailOggetto = replacePlaceholders(emailOggetto, { nome: to_name });
    emailCorpo = replacePlaceholders(emailCorpo, { nome: to_name });

    const transporter = await getTransporter();
    const config = getEmailConfig();

    const result = await transporter.sendMail({
      from: `"${config.nome_mittente || 'Antonio Tritto'}" <${config.email}>`,
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

// POST /api/email/send-bulk - Invia email in bulk
router.post('/send-bulk', async (req, res) => {
  try {
    const { contatti_ids, oggetto, corpo, template_id, delay_seconds = 3 } = req.body;

    if (!contatti_ids || contatti_ids.length === 0) {
      return res.status(400).json({ error: 'Nessun contatto selezionato' });
    }

    if (bulkEmailStatus.inProgress) {
      return res.status(400).json({ error: 'Invio bulk già in corso. Attendi il completamento.' });
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

    res.json({
      success: true,
      message: `Invio avviato per ${contatti.length} contatti`,
      status_url: '/api/email/bulk-status'
    });

    // Processo asincrono
    let emailOggetto = oggetto;
    let emailCorpo = corpo;

    if (template_id && emailTemplates[template_id]) {
      const template = emailTemplates[template_id];
      emailOggetto = emailOggetto || template.oggetto;
      emailCorpo = emailCorpo || template.corpo;
    }

    const transporter = await getTransporter();
    const config = getEmailConfig();

    for (const contatto of contatti) {
      if (bulkEmailStatus.cancelled) break;

      try {
        const nomeCompleto = `${contatto.nome} ${contatto.cognome || ''}`.trim();
        const oggettoPersonalizzato = replacePlaceholders(emailOggetto, { nome: nomeCompleto });
        const corpoPersonalizzato = replacePlaceholders(emailCorpo, { nome: nomeCompleto });

        await transporter.sendMail({
          from: `"${config.nome_mittente || 'Antonio Tritto'}" <${config.email}>`,
          to: contatto.email,
          subject: oggettoPersonalizzato,
          text: corpoPersonalizzato,
          html: convertToHtml(corpoPersonalizzato)
        });

        bulkEmailStatus.sent++;

        try {
          db.prepare(`
            INSERT INTO interazioni (contatto_id, tipo, canale, oggetto, descrizione)
            VALUES (?, 'Email', 'Email', ?, 'Email bulk inviata')
          `).run(contatto.id, oggettoPersonalizzato);
        } catch (e) {}

        if (contatti.indexOf(contatto) < contatti.length - 1) {
          await sleep(delay_seconds * 1000);
        }

      } catch (error) {
        console.error('❌ Errore invio email a', contatto.email, ':', error.message);
        console.error('Stack:', error.stack);
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

// GET /api/email/bulk-status
router.get('/bulk-status', (req, res) => {
  res.json(bulkEmailStatus);
});

// POST /api/email/bulk-cancel
router.post('/bulk-cancel', (req, res) => {
  if (bulkEmailStatus.inProgress) {
    bulkEmailStatus.cancelled = true;
    res.json({ success: true, message: 'Richiesta annullamento inviata' });
  } else {
    res.json({ success: false, message: 'Nessun invio in corso' });
  }
});

// ========== FUNZIONI HELPER ==========

function getAuthMethod() {
  try {
    const row = db.prepare("SELECT valore FROM configurazione WHERE chiave = 'email_auth_method'").get();
    return row?.valore || 'smtp';
  } catch (e) {
    return 'smtp';
  }
}

function getOAuthConfig() {
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
      access_token: config.oauth_access_token,
      refresh_token: config.oauth_refresh_token,
      nome_mittente: config.nome_mittente || 'Antonio Tritto'
    };
  } catch (e) {
    return {};
  }
}

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

async function getTransporter() {
  const authMethod = getAuthMethod();
  console.log('📧 Auth method:', authMethod);

  if (authMethod === 'oauth2') {
    const config = getOAuthConfig();
    console.log('📧 OAuth config email:', config.email);
    console.log('📧 Has refresh_token:', !!config.refresh_token);

    oauth2Client.setCredentials({
      refresh_token: config.refresh_token
    });

    try {
      const accessToken = await oauth2Client.getAccessToken();
      console.log('📧 Access token obtained:', !!accessToken.token);

      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: config.email,
          clientId: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          refreshToken: config.refresh_token,
          accessToken: accessToken.token
        }
      });
    } catch (tokenError) {
      console.error('❌ Errore ottenimento access token:', tokenError.message);
      throw tokenError;
    }
  } else {
    const config = getEmailConfig();
    return createSmtpTransporter(config);
  }
}

function createSmtpTransporter(config) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.email,
      pass: config.password
    },
    pool: true,
    maxConnections: 1,
    rateDelta: 3000,
    rateLimit: 5
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
