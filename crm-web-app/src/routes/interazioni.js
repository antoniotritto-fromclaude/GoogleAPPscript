/**
 * Interazioni/Touchpoints API Routes
 * Tracciamento completo del percorso contatti
 */

const express = require('express');
const router = express.Router();
const { db, saveDatabase } = require('../models/database');

// GET /api/interazioni - Lista tutte le interazioni
router.get('/', (req, res) => {
  try {
    const { contatto_id, tipo, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT i.*, c.nome as contatto_nome, c.cognome as contatto_cognome
      FROM interazioni i
      LEFT JOIN contatti c ON i.contatto_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (contatto_id) {
      query += ` AND i.contatto_id = ?`;
      params.push(contatto_id);
    }
    if (tipo) {
      query += ` AND i.tipo = ?`;
      params.push(tipo);
    }

    query += ` ORDER BY i.data_interazione DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const interazioni = db.prepare(query).all(...params);
    res.json(interazioni);
  } catch (error) {
    console.error('Errore interazioni:', error);
    res.status(500).json({ error: 'Errore nel recupero interazioni' });
  }
});

// GET /api/interazioni/contatto/:contatto_id - Timeline interazioni per contatto
router.get('/contatto/:contatto_id', (req, res) => {
  try {
    const interazioni = db.prepare(`
      SELECT * FROM interazioni
      WHERE contatto_id = ?
      ORDER BY data_interazione DESC
    `).all(req.params.contatto_id);

    // Aggrega anche chiamate per una timeline completa
    const chiamate = db.prepare(`
      SELECT
        id,
        contatto_id,
        'Chiamata' as tipo,
        tipo_chiamata as canale,
        COALESCE(note, '') as descrizione,
        esito,
        data_chiamata as data_interazione,
        data_follow_up as data_prossima_azione,
        NULL as prossima_azione,
        NULL as funnel_assegnato,
        NULL as email_numero
      FROM chiamate
      WHERE contatto_id = ?
    `).all(req.params.contatto_id);

    // Combina e ordina per data
    const timeline = [...interazioni, ...chiamate].sort((a, b) =>
      new Date(b.data_interazione) - new Date(a.data_interazione)
    );

    res.json(timeline);
  } catch (error) {
    console.error('Errore timeline contatto:', error);
    res.status(500).json({ error: 'Errore nel recupero timeline' });
  }
});

// GET /api/interazioni/stats - Statistiche interazioni
router.get('/stats', (req, res) => {
  try {
    const perTipo = db.prepare(`
      SELECT tipo, COUNT(*) as count
      FROM interazioni
      GROUP BY tipo
      ORDER BY count DESC
    `).all();

    const perCanale = db.prepare(`
      SELECT canale, COUNT(*) as count
      FROM interazioni
      WHERE canale IS NOT NULL
      GROUP BY canale
      ORDER BY count DESC
    `).all();

    const ultimiGiorni = db.prepare(`
      SELECT DATE(data_interazione) as giorno, COUNT(*) as count
      FROM interazioni
      WHERE data_interazione >= date('now', '-30 days')
      GROUP BY DATE(data_interazione)
      ORDER BY giorno DESC
    `).all();

    res.json({ perTipo, perCanale, ultimiGiorni });
  } catch (error) {
    res.status(500).json({ error: 'Errore statistiche' });
  }
});

// POST /api/interazioni - Crea nuova interazione
router.post('/', (req, res) => {
  try {
    const {
      contatto_id, pipeline_id, chiamata_id, tipo, canale,
      oggetto, descrizione, esito, data_interazione,
      data_prossima_azione, prossima_azione, funnel_assegnato, email_numero
    } = req.body;

    if (!contatto_id || !tipo) {
      return res.status(400).json({ error: 'contatto_id e tipo sono obbligatori' });
    }

    const result = db.prepare(`
      INSERT INTO interazioni (
        contatto_id, pipeline_id, chiamata_id, tipo, canale,
        oggetto, descrizione, esito, data_interazione,
        data_prossima_azione, prossima_azione, funnel_assegnato, email_numero
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?, ?)
    `).run(
      contatto_id, pipeline_id, chiamata_id, tipo, canale,
      oggetto, descrizione, esito, data_interazione,
      data_prossima_azione, prossima_azione, funnel_assegnato, email_numero
    );

    // Aggiorna stato_sviluppo del contatto se necessario
    if (tipo === 'Prima Chiamata' || tipo === 'Chiamata') {
      db.prepare(`UPDATE contatti SET stato_sviluppo = 'Contattato', data_ultimo_contatto = date('now') WHERE id = ? AND stato_sviluppo = 'Nuovo'`).run(contatto_id);
    } else if (tipo === 'Email' && email_numero === 1) {
      db.prepare(`UPDATE contatti SET stato_sviluppo = 'Contattato', data_ultimo_contatto = date('now') WHERE id = ? AND stato_sviluppo = 'Nuovo'`).run(contatto_id);
    } else if (tipo === 'Funnel Email') {
      db.prepare(`UPDATE contatti SET stato_sviluppo = 'In Lavorazione', data_ultimo_contatto = date('now') WHERE id = ?`).run(contatto_id);
    } else if (tipo === 'Meeting' || tipo === 'Proposta') {
      db.prepare(`UPDATE contatti SET stato_sviluppo = 'Qualificato', data_ultimo_contatto = date('now') WHERE id = ?`).run(contatto_id);
    } else if (tipo === 'Pipeline') {
      db.prepare(`UPDATE contatti SET stato_sviluppo = 'In Pipeline', data_ultimo_contatto = date('now') WHERE id = ?`).run(contatto_id);
    }

    saveDatabase();
    const newInterazione = db.prepare('SELECT * FROM interazioni WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newInterazione);
  } catch (error) {
    console.error('Errore creazione interazione:', error);
    res.status(500).json({ error: 'Errore nella creazione interazione' });
  }
});

// PUT /api/interazioni/:id - Aggiorna interazione
router.put('/:id', (req, res) => {
  try {
    const interazione = db.prepare('SELECT * FROM interazioni WHERE id = ?').get(req.params.id);
    if (!interazione) {
      return res.status(404).json({ error: 'Interazione non trovata' });
    }

    const {
      tipo, canale, oggetto, descrizione, esito,
      data_prossima_azione, prossima_azione, funnel_assegnato, email_numero
    } = req.body;

    db.prepare(`
      UPDATE interazioni SET
        tipo = COALESCE(?, tipo),
        canale = COALESCE(?, canale),
        oggetto = COALESCE(?, oggetto),
        descrizione = COALESCE(?, descrizione),
        esito = COALESCE(?, esito),
        data_prossima_azione = COALESCE(?, data_prossima_azione),
        prossima_azione = COALESCE(?, prossima_azione),
        funnel_assegnato = COALESCE(?, funnel_assegnato),
        email_numero = COALESCE(?, email_numero)
      WHERE id = ?
    `).run(tipo, canale, oggetto, descrizione, esito, data_prossima_azione, prossima_azione, funnel_assegnato, email_numero, req.params.id);

    saveDatabase();
    const updated = db.prepare('SELECT * FROM interazioni WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento interazione' });
  }
});

// DELETE /api/interazioni/:id - Elimina interazione
router.delete('/:id', (req, res) => {
  try {
    const interazione = db.prepare('SELECT * FROM interazioni WHERE id = ?').get(req.params.id);
    if (!interazione) {
      return res.status(404).json({ error: 'Interazione non trovata' });
    }

    db.prepare('DELETE FROM interazioni WHERE id = ?').run(req.params.id);
    saveDatabase();
    res.json({ message: 'Interazione eliminata', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione interazione' });
  }
});

// POST /api/interazioni/registra-chiamata - Registra chiamata come interazione
router.post('/registra-chiamata', (req, res) => {
  try {
    const { contatto_id, esito, note, data_follow_up } = req.body;

    if (!contatto_id) {
      return res.status(400).json({ error: 'contatto_id obbligatorio' });
    }

    // Conta le chiamate precedenti per questo contatto
    const chiamatePrecedenti = db.prepare(`
      SELECT COUNT(*) as count FROM interazioni
      WHERE contatto_id = ? AND tipo LIKE '%Chiamata%'
    `).get(contatto_id);

    const numeroChiamata = (chiamatePrecedenti?.count || 0) + 1;
    const tipo = numeroChiamata === 1 ? 'Prima Chiamata' : `Chiamata #${numeroChiamata}`;

    const result = db.prepare(`
      INSERT INTO interazioni (
        contatto_id, tipo, canale, descrizione, esito,
        data_prossima_azione, prossima_azione
      ) VALUES (?, ?, 'Telefono', ?, ?, ?, ?)
    `).run(
      contatto_id, tipo, note, esito,
      data_follow_up, data_follow_up ? 'Follow-up chiamata' : null
    );

    // Aggiorna stato contatto
    db.prepare(`
      UPDATE contatti SET
        stato_sviluppo = CASE WHEN stato_sviluppo = 'Nuovo' THEN 'Contattato' ELSE stato_sviluppo END,
        data_ultimo_contatto = date('now')
      WHERE id = ?
    `).run(contatto_id);

    saveDatabase();
    const newInterazione = db.prepare('SELECT * FROM interazioni WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newInterazione);
  } catch (error) {
    console.error('Errore registrazione chiamata:', error);
    res.status(500).json({ error: 'Errore nella registrazione chiamata' });
  }
});

// POST /api/interazioni/registra-email - Registra email come interazione
router.post('/registra-email', (req, res) => {
  try {
    const { contatto_id, oggetto, descrizione, email_numero } = req.body;

    if (!contatto_id) {
      return res.status(400).json({ error: 'contatto_id obbligatorio' });
    }

    // Se non specificato, conta le email precedenti
    let numero = email_numero;
    if (!numero) {
      const emailPrecedenti = db.prepare(`
        SELECT COUNT(*) as count FROM interazioni
        WHERE contatto_id = ? AND tipo = 'Email'
      `).get(contatto_id);
      numero = (emailPrecedenti?.count || 0) + 1;
    }

    const result = db.prepare(`
      INSERT INTO interazioni (
        contatto_id, tipo, canale, oggetto, descrizione, email_numero
      ) VALUES (?, 'Email', 'Email', ?, ?, ?)
    `).run(contatto_id, oggetto, descrizione, numero);

    // Aggiorna stato contatto
    db.prepare(`
      UPDATE contatti SET
        stato_sviluppo = CASE WHEN stato_sviluppo = 'Nuovo' THEN 'Contattato' ELSE stato_sviluppo END,
        data_ultimo_contatto = date('now')
      WHERE id = ?
    `).run(contatto_id);

    saveDatabase();
    const newInterazione = db.prepare('SELECT * FROM interazioni WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newInterazione);
  } catch (error) {
    console.error('Errore registrazione email:', error);
    res.status(500).json({ error: 'Errore nella registrazione email' });
  }
});

// POST /api/interazioni/assegna-funnel - Assegna funnel email a contatto
router.post('/assegna-funnel', (req, res) => {
  try {
    const { contatto_id, funnel_nome, descrizione } = req.body;

    if (!contatto_id || !funnel_nome) {
      return res.status(400).json({ error: 'contatto_id e funnel_nome obbligatori' });
    }

    const result = db.prepare(`
      INSERT INTO interazioni (
        contatto_id, tipo, canale, oggetto, descrizione, funnel_assegnato
      ) VALUES (?, 'Funnel Email', 'Email', ?, ?, ?)
    `).run(contatto_id, `Assegnato funnel: ${funnel_nome}`, descrizione, funnel_nome);

    // Aggiorna stato contatto a "In Lavorazione"
    db.prepare(`
      UPDATE contatti SET
        stato_sviluppo = 'In Lavorazione',
        data_ultimo_contatto = date('now')
      WHERE id = ?
    `).run(contatto_id);

    saveDatabase();
    const newInterazione = db.prepare('SELECT * FROM interazioni WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newInterazione);
  } catch (error) {
    console.error('Errore assegnazione funnel:', error);
    res.status(500).json({ error: 'Errore nell\'assegnazione funnel' });
  }
});

// POST /api/interazioni/sposta-pipeline - Sposta contatto in pipeline
router.post('/sposta-pipeline', (req, res) => {
  try {
    const { contatto_id, nome_deal, aum_previsto, fonte } = req.body;

    if (!contatto_id) {
      return res.status(400).json({ error: 'contatto_id obbligatorio' });
    }

    // Recupera info contatto
    const contatto = db.prepare('SELECT * FROM contatti WHERE id = ?').get(contatto_id);
    if (!contatto) {
      return res.status(404).json({ error: 'Contatto non trovato' });
    }

    // Crea deal in pipeline
    const dealName = nome_deal || `${contatto.nome} ${contatto.cognome || ''} - Opportunità`;
    const pipelineResult = db.prepare(`
      INSERT INTO pipeline (
        contatto_id, nome_deal, stage, aum_previsto, fonte, data_creazione
      ) VALUES (?, ?, 'Lead', ?, ?, date('now'))
    `).run(contatto_id, dealName, aum_previsto || contatto.aum_potenziale || 0, fonte || contatto.fonte_acquisizione);

    // Registra interazione
    const result = db.prepare(`
      INSERT INTO interazioni (
        contatto_id, pipeline_id, tipo, canale, descrizione
      ) VALUES (?, ?, 'Pipeline', 'Sistema', ?)
    `).run(contatto_id, pipelineResult.lastInsertRowid, `Spostato in Pipeline come "${dealName}"`);

    // Aggiorna stato contatto
    db.prepare(`
      UPDATE contatti SET
        stato_sviluppo = 'In Pipeline',
        data_ultimo_contatto = date('now')
      WHERE id = ?
    `).run(contatto_id);

    saveDatabase();

    res.status(201).json({
      interazione: db.prepare('SELECT * FROM interazioni WHERE id = ?').get(result.lastInsertRowid),
      pipeline: db.prepare('SELECT * FROM pipeline WHERE id = ?').get(pipelineResult.lastInsertRowid)
    });
  } catch (error) {
    console.error('Errore spostamento pipeline:', error);
    res.status(500).json({ error: 'Errore nello spostamento in pipeline' });
  }
});

module.exports = router;
