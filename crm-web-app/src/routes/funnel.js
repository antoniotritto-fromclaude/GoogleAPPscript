/**
 * Funnel Email API Routes
 * Sistema di email marketing automatico basato su cluster cliente
 * Allineato al foglio Excel PIPELINE - Template Email Funnel
 */

const express = require('express');
const router = express.Router();
const { db, saveDatabase } = require('../models/database');

// Template email predefiniti dal foglio Excel
const defaultTemplates = [
  // Imprenditore - 4 step
  {
    cluster: 'Imprenditore',
    step: 1,
    giorni_attesa: 0,
    oggetto: '{{nome}}, una cosa veloce',
    corpo: `Buongiorno {{nome}},

so che gestire un'azienda ti lascia poco tempo per pensare al patrimonio personale. Ma proprio per questo ti scrivo: spesso gli imprenditori come te scoprono troppo tardi che il loro patrimonio personale e quello aziendale sono troppo legati.

Ho aiutato diversi imprenditori a proteggere e far crescere il loro patrimonio personale, indipendentemente dall'andamento dell'azienda.

Se vuoi, possiamo fare una chiacchierata di 15 minuti per capire se posso esserti utile.

{{cta_link}}

A presto,
Antonio Tritto`,
    link_cta: 'https://calendly.com/antoniotritto'
  },
  {
    cluster: 'Imprenditore',
    step: 2,
    giorni_attesa: 5,
    oggetto: '3 rischi patrimoniali che ogni imprenditore sottovaluta',
    corpo: `Buongiorno {{nome}},

le scrivo perché nelle ultime settimane ho incontrato diversi imprenditori che, nonostante il successo aziendale, avevano trascurato 3 aspetti fondamentali:

1. Separazione patrimonio personale/aziendale
2. Pianificazione successoria
3. Ottimizzazione fiscale degli investimenti

Non voglio allarmarla, ma questi sono errori che possono costare caro nel lungo termine.

Se vuole, posso mostrarle come affrontare questi temi in modo concreto.

{{cta_link}}

Cordiali saluti,
Antonio Tritto`,
    link_cta: 'https://calendly.com/antoniotritto'
  },
  {
    cluster: 'Imprenditore',
    step: 3,
    giorni_attesa: 10,
    oggetto: '{{nome}}, ho preparato qualcosa per lei',
    corpo: `Buongiorno {{nome}},

ho preparato un breve video dove spiego come gli imprenditori possono proteggere il proprio patrimonio personale senza sottrarre tempo all'azienda.

Dura solo 5 minuti e credo possa esserle utile.

{{cta_link}}

Se dopo averlo visto vuole approfondire, sono a disposizione.

Cordiali saluti,
Antonio Tritto`,
    link_cta: 'https://calendly.com/antoniotritto'
  },
  {
    cluster: 'Imprenditore',
    step: 4,
    giorni_attesa: 17,
    oggetto: 'Un ultimo pensiero, {{nome}}',
    corpo: `Buongiorno {{nome}},

nelle scorse settimane le ho scritto per proporle una consulenza sulla gestione del patrimonio personale.

Non ho ricevuto risposta, e questo potrebbe significare che non è il momento giusto. Nessun problema.

Le lascio comunque i miei riferimenti: se in futuro dovesse avere bisogno di un confronto su questi temi, sarò felice di aiutarla.

{{cta_link}}

Un caro saluto,
Antonio Tritto`,
    link_cta: 'https://calendly.com/antoniotritto'
  },

  // Libero Professionista - 4 step
  {
    cluster: 'Libero Professionista',
    step: 1,
    giorni_attesa: 0,
    oggetto: '{{nome}}, un momento per noi',
    corpo: `Buongiorno {{nome}},

tra pazienti, clienti, scadenze e adempimenti, so che il tempo per pensare al proprio patrimonio è sempre poco.

Ma proprio per questo le scrivo: molti professionisti come lei scoprono troppo tardi che avrebbero potuto ottimizzare molto di più la propria situazione fiscale e patrimoniale.

Possiamo fare una breve chiacchierata per capire se posso esserle utile?

{{cta_link}}

A presto,
Antonio Tritto`,
    link_cta: 'https://calendly.com/antoniotritto'
  },
  {
    cluster: 'Libero Professionista',
    step: 2,
    giorni_attesa: 5,
    oggetto: 'Quanto le costa davvero non avere una strategia fiscale?',
    corpo: `Buongiorno {{nome}},

le faccio una domanda diretta: sa quanto sta pagando in più di tasse rispetto a quello che potrebbe?

Molti professionisti non hanno il tempo di approfondire questi temi, ma le assicuro che con una pianificazione corretta si possono ottenere risultati significativi.

Se vuole, posso mostrarle alcune strategie concrete in 20 minuti.

{{cta_link}}

Cordiali saluti,
Antonio Tritto`,
    link_cta: 'https://calendly.com/antoniotritto'
  },
  {
    cluster: 'Libero Professionista',
    step: 3,
    giorni_attesa: 10,
    oggetto: '{{nome}}, un video che le sara utile',
    corpo: `Buongiorno {{nome}},

ho preparato un breve video dove mostro 3 strategie che i professionisti possono usare per ottimizzare la propria situazione fiscale e patrimoniale.

Dura 5 minuti e credo possa esserle utile.

{{cta_link}}

Se vuole approfondire, sono a disposizione.

Cordiali saluti,
Antonio Tritto`,
    link_cta: 'https://calendly.com/antoniotritto'
  },
  {
    cluster: 'Libero Professionista',
    step: 4,
    giorni_attesa: 17,
    oggetto: 'Resto a disposizione, {{nome}}',
    corpo: `Buongiorno {{nome}},

nelle scorse settimane le ho condiviso alcune informazioni sulla gestione patrimoniale per professionisti.

Se non è il momento giusto, lo capisco perfettamente.

Le lascio i miei riferimenti per quando vorra approfondire.

{{cta_link}}

Un caro saluto,
Antonio Tritto`,
    link_cta: 'https://calendly.com/antoniotritto'
  },

  // Dipendente - 4 step
  {
    cluster: 'Dipendente',
    step: 1,
    giorni_attesa: 0,
    oggetto: '{{nome}}, volevo assicurarmi che avesse ricevuto',
    corpo: `Buongiorno {{nome}},

le scrivo per riprendere il nostro contatto e capire se posso esserle utile nella gestione del suo risparmio.

So che tra lavoro e famiglia il tempo e poco, ma proprio per questo e importante avere qualcuno che si occupi del vostro patrimonio in modo professionale.

Possiamo fare una breve chiamata per conoscerci?

{{cta_link}}

A presto,
Antonio Tritto`,
    link_cta: 'https://calendly.com/antoniotritto'
  },
  {
    cluster: 'Dipendente',
    step: 2,
    giorni_attesa: 5,
    oggetto: 'Il suo TFR sta perdendo valore - ecco perche',
    corpo: `Buongiorno {{nome}},

le dico una cosa che sorprende quasi tutti: il TFR lasciato in azienda rende molto meno dell'inflazione.

Questo significa che ogni anno il valore reale del suo TFR diminuisce.

C'e una soluzione semplice che pochi conoscono. Se vuole, posso spiegargliela in 15 minuti.

{{cta_link}}

Cordiali saluti,
Antonio Tritto`,
    link_cta: 'https://calendly.com/antoniotritto'
  },
  {
    cluster: 'Dipendente',
    step: 3,
    giorni_attesa: 10,
    oggetto: '{{nome}}, un video che le apre gli occhi sul TFR',
    corpo: `Buongiorno {{nome}},

ho preparato un breve video dove spiego come valorizzare al meglio il TFR e i risparmi accumulati.

Dura solo 5 minuti e credo le sara molto utile.

{{cta_link}}

Se vuole approfondire, sono a disposizione.

Cordiali saluti,
Antonio Tritto`,
    link_cta: 'https://calendly.com/antoniotritto'
  },
  {
    cluster: 'Dipendente',
    step: 4,
    giorni_attesa: 17,
    oggetto: '{{nome}}, l\'ultimo promemoria - poi decida lei',
    corpo: `Buongiorno {{nome}},

nelle ultime settimane le ho scritto per proporle una consulenza sulla gestione del risparmio e del TFR.

Se non e il momento giusto, nessun problema.

Le lascio i miei riferimenti per quando vorra approfondire.

{{cta_link}}

Un caro saluto,
Antonio Tritto`,
    link_cta: 'https://calendly.com/antoniotritto'
  }
];

// GET /api/funnel/templates - Lista tutti i template
router.get('/templates', (req, res) => {
  try {
    let templates = db.prepare('SELECT * FROM email_templates ORDER BY cluster, step').all();

    // Se non ci sono template, usa quelli predefiniti
    if (!templates || templates.length === 0) {
      templates = defaultTemplates.map((t, idx) => ({ id: idx + 1, ...t, attivo: 1 }));
    }

    res.json(templates);
  } catch (error) {
    console.error('Errore recupero templates:', error);
    res.json(defaultTemplates.map((t, idx) => ({ id: idx + 1, ...t, attivo: 1 })));
  }
});

// GET /api/funnel/templates/:cluster - Template per cluster
router.get('/templates/:cluster', (req, res) => {
  try {
    const { cluster } = req.params;
    let templates = db.prepare('SELECT * FROM email_templates WHERE cluster = ? ORDER BY step').all(cluster);

    if (!templates || templates.length === 0) {
      templates = defaultTemplates.filter(t => t.cluster === cluster);
    }

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Errore recupero templates' });
  }
});

// POST /api/funnel/templates - Salva template (crea o aggiorna)
router.post('/templates', (req, res) => {
  try {
    const { cluster, step, giorni_attesa, oggetto, corpo, link_cta } = req.body;

    if (!cluster || !step || !oggetto || !corpo) {
      return res.status(400).json({ error: 'Campi obbligatori: cluster, step, oggetto, corpo' });
    }

    // Verifica se esiste già
    const existing = db.prepare('SELECT id FROM email_templates WHERE cluster = ? AND step = ?').get(cluster, step);

    if (existing) {
      db.prepare(`
        UPDATE email_templates SET oggetto = ?, corpo = ?, giorni_attesa = ?, link_cta = ?, updated_at = CURRENT_TIMESTAMP
        WHERE cluster = ? AND step = ?
      `).run(oggetto, corpo, giorni_attesa || 0, link_cta, cluster, step);
    } else {
      db.prepare(`
        INSERT INTO email_templates (cluster, step, giorni_attesa, oggetto, corpo, link_cta)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(cluster, step, giorni_attesa || 0, oggetto, corpo, link_cta);
    }

    saveDatabase();
    res.json({ success: true, message: 'Template salvato' });
  } catch (error) {
    console.error('Errore salvataggio template:', error);
    res.status(500).json({ error: 'Errore nel salvataggio' });
  }
});

// POST /api/funnel/init-templates - Inizializza template predefiniti
router.post('/init-templates', (req, res) => {
  try {
    // Inserisci solo se non esistono
    const count = db.prepare('SELECT COUNT(*) as c FROM email_templates').get();

    if (count.c === 0) {
      defaultTemplates.forEach(t => {
        db.prepare(`
          INSERT INTO email_templates (cluster, step, giorni_attesa, oggetto, corpo, link_cta)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(t.cluster, t.step, t.giorni_attesa, t.oggetto, t.corpo, t.link_cta);
      });
      saveDatabase();
      res.json({ success: true, message: `${defaultTemplates.length} template inseriti` });
    } else {
      res.json({ success: true, message: 'Template gia presenti', count: count.c });
    }
  } catch (error) {
    console.error('Errore init templates:', error);
    res.status(500).json({ error: 'Errore inizializzazione' });
  }
});

// GET /api/funnel/leads-ready - Lead pronti per invio (basato su giorni_attesa)
router.get('/leads-ready', (req, res) => {
  try {
    const leads = db.prepare(`
      SELECT c.*,
        CASE
          WHEN c.funnel_status = 'Non avviato' THEN 1
          WHEN c.funnel_status = 'Step 1 inviato' THEN 2
          WHEN c.funnel_status = 'Step 2 inviato' THEN 3
          WHEN c.funnel_status = 'Step 3 inviato' THEN 4
          ELSE 0
        END as prossimo_step,
        COALESCE(c.cluster_cliente, 'Dipendente') as cluster_effettivo
      FROM contatti c
      WHERE c.funnel_status != 'Risposto'
        AND c.funnel_status != 'Step 4 inviato'
        AND c.email IS NOT NULL
        AND c.email != ''
        AND c.tipo_cliente = 'Potenziale'
    `).all();

    // Filtra in base ai giorni di attesa
    const oggi = new Date();
    const leadsReady = leads.filter(lead => {
      if (lead.prossimo_step === 0) return false;
      if (lead.prossimo_step === 1) return true; // Step 1 sempre pronto

      // Trova il template per questo step
      const template = defaultTemplates.find(t =>
        t.cluster === lead.cluster_effettivo && t.step === lead.prossimo_step
      ) || defaultTemplates.find(t =>
        t.cluster === 'Dipendente' && t.step === lead.prossimo_step
      );

      if (!template) return false;

      // Controlla se sono passati abbastanza giorni
      if (!lead.data_ultimo_invio_funnel) return true;

      const ultimoInvio = new Date(lead.data_ultimo_invio_funnel);
      const giorniPassati = Math.floor((oggi - ultimoInvio) / (1000 * 60 * 60 * 24));

      return giorniPassati >= template.giorni_attesa;
    });

    res.json(leadsReady);
  } catch (error) {
    console.error('Errore leads ready:', error);
    res.status(500).json({ error: 'Errore recupero leads' });
  }
});

// POST /api/funnel/send/:contattoId - Invia email funnel a contatto
router.post('/send/:contattoId', async (req, res) => {
  try {
    const { contattoId } = req.params;
    const contatto = db.prepare('SELECT * FROM contatti WHERE id = ?').get(contattoId);

    if (!contatto) {
      return res.status(404).json({ error: 'Contatto non trovato' });
    }

    if (!contatto.email) {
      return res.status(400).json({ error: 'Contatto senza email' });
    }

    // Determina lo step da inviare
    let step = 1;
    if (contatto.funnel_status === 'Step 1 inviato') step = 2;
    else if (contatto.funnel_status === 'Step 2 inviato') step = 3;
    else if (contatto.funnel_status === 'Step 3 inviato') step = 4;
    else if (contatto.funnel_status === 'Step 4 inviato' || contatto.funnel_status === 'Risposto') {
      return res.status(400).json({ error: 'Funnel completato per questo contatto' });
    }

    // Cluster: Azienda usa template Imprenditore
    let cluster = contatto.cluster_cliente || 'Dipendente';
    if (cluster === 'Azienda') cluster = 'Imprenditore';

    // Trova il template
    let template = db.prepare('SELECT * FROM email_templates WHERE cluster = ? AND step = ?').get(cluster, step);
    if (!template) {
      template = defaultTemplates.find(t => t.cluster === cluster && t.step === step);
    }

    if (!template) {
      return res.status(400).json({ error: `Template non trovato per ${cluster} step ${step}` });
    }

    // Prepara il messaggio
    const nome = contatto.nome + (contatto.cognome ? ' ' + contatto.cognome : '');
    const oggetto = template.oggetto.replace(/\{\{nome\}\}/gi, contatto.nome);
    const corpo = template.corpo
      .replace(/\{\{nome\}\}/gi, contatto.nome)
      .replace(/\{\{cta_link\}\}/gi, template.link_cta || 'https://calendly.com/antoniotritto');

    // Invia email tramite il servizio email esistente
    // Per ora registriamo solo il log - l'invio effettivo richiede configurazione email

    // Registra nel log
    db.prepare(`
      INSERT INTO log_invii (contatto_id, contatto_nome, cluster, step, oggetto, email_destinatario, esito)
      VALUES (?, ?, ?, ?, ?, ?, 'OK')
    `).run(contattoId, nome, cluster, step, oggetto, contatto.email);

    // Aggiorna stato funnel del contatto
    const nuovoStatus = `Step ${step} inviato`;
    db.prepare(`
      UPDATE contatti
      SET funnel_status = ?, data_ultimo_invio_funnel = date('now'), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nuovoStatus, contattoId);

    saveDatabase();

    res.json({
      success: true,
      message: `Email Step ${step} preparata per ${nome}`,
      email: {
        to: contatto.email,
        subject: oggetto,
        body: corpo
      },
      nota: 'Per inviare effettivamente, configurare Gmail OAuth nella sezione Email'
    });
  } catch (error) {
    console.error('Errore invio funnel:', error);
    res.status(500).json({ error: 'Errore nell\'invio' });
  }
});

// POST /api/funnel/mark-responded/:contattoId - Segna come risposto (ferma funnel)
router.post('/mark-responded/:contattoId', (req, res) => {
  try {
    const { contattoId } = req.params;

    db.prepare(`
      UPDATE contatti SET funnel_status = 'Risposto', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(contattoId);

    saveDatabase();
    res.json({ success: true, message: 'Funnel fermato - contatto ha risposto' });
  } catch (error) {
    res.status(500).json({ error: 'Errore aggiornamento' });
  }
});

// POST /api/funnel/reset/:contattoId - Reset funnel contatto
router.post('/reset/:contattoId', (req, res) => {
  try {
    const { contattoId } = req.params;

    db.prepare(`
      UPDATE contatti SET funnel_status = 'Non avviato', data_ultimo_invio_funnel = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(contattoId);

    saveDatabase();
    res.json({ success: true, message: 'Funnel resettato' });
  } catch (error) {
    res.status(500).json({ error: 'Errore reset' });
  }
});

// GET /api/funnel/log - Log invii email
router.get('/log', (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const logs = db.prepare(`
      SELECT * FROM log_invii ORDER BY data_invio DESC LIMIT ? OFFSET ?
    `).all(parseInt(limit), parseInt(offset));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Errore recupero log' });
  }
});

// GET /api/funnel/stats - Statistiche funnel
router.get('/stats', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        funnel_status,
        COUNT(*) as count
      FROM contatti
      WHERE tipo_cliente = 'Potenziale'
      GROUP BY funnel_status
    `).all();

    const perCluster = db.prepare(`
      SELECT
        COALESCE(cluster_cliente, 'Non assegnato') as cluster,
        funnel_status,
        COUNT(*) as count
      FROM contatti
      WHERE tipo_cliente = 'Potenziale'
      GROUP BY cluster_cliente, funnel_status
    `).all();

    const inviiOggi = db.prepare(`
      SELECT COUNT(*) as count FROM log_invii WHERE date(data_invio) = date('now')
    `).get();

    const inviiSettimana = db.prepare(`
      SELECT COUNT(*) as count FROM log_invii WHERE data_invio >= datetime('now', '-7 days')
    `).get();

    res.json({
      perStatus: stats,
      perCluster,
      inviiOggi: inviiOggi.count,
      inviiSettimana: inviiSettimana.count
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore statistiche' });
  }
});

module.exports = router;
