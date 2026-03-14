/**
 * Pipeline API Routes
 * Gestione sales pipeline
 */

const express = require('express');
const router = express.Router();
const { db, saveDatabase } = require('../models/database');

// GET /api/pipeline - Lista pipeline
router.get('/', (req, res) => {
  try {
    const { stage, responsabile, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT p.*, c.nome || ' ' || COALESCE(c.cognome, '') as contatto_nome, c.azienda, c.email, c.telefono
      FROM pipeline p
      LEFT JOIN contatti c ON p.contatto_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (stage) {
      query += ` AND p.stage = ?`;
      params.push(stage);
    }
    if (responsabile) {
      query += ` AND p.responsabile = ?`;
      params.push(responsabile);
    }

    // Stadi allineati al foglio Excel: Prospect, Lead, Primo Contatto, Appuntamento, Secondo Appuntamento, Chiusura
    query += ` ORDER BY
      CASE p.stage
        WHEN 'Prospect' THEN 1
        WHEN 'Lead' THEN 2
        WHEN 'Primo Contatto' THEN 3
        WHEN 'Appuntamento' THEN 4
        WHEN 'Secondo Appuntamento' THEN 5
        WHEN 'Chiusura' THEN 6
        WHEN 'Cliente Attivo' THEN 7
        WHEN 'Chiuso Perso' THEN 8
      END,
      p.aum_previsto DESC
      LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const pipeline = db.prepare(query).all(...params);
    res.json(pipeline);
  } catch (error) {
    console.error('Errore pipeline:', error);
    res.status(500).json({ error: 'Errore nel recupero pipeline' });
  }
});

// ===== ROUTE SPECIFICHE PRIMA DI /:id =====

// GET /api/pipeline/funnel - Dati per funnel
router.get('/funnel', (req, res) => {
  try {
    const funnel = db.prepare(`
      SELECT stage, COUNT(*) as count, COALESCE(SUM(aum_previsto), 0) as valore,
        AVG(probabilita) as probabilita_media
      FROM pipeline
      WHERE stage != 'Chiuso Perso'
      GROUP BY stage
      ORDER BY
        CASE stage
          WHEN 'Prospect' THEN 1
          WHEN 'Lead' THEN 2
          WHEN 'Primo Contatto' THEN 3
          WHEN 'Appuntamento' THEN 4
          WHEN 'Secondo Appuntamento' THEN 5
          WHEN 'Chiusura' THEN 6
          WHEN 'Cliente Attivo' THEN 7
        END
    `).all();

    const persi = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(aum_previsto), 0) as valore
      FROM pipeline WHERE stage = 'Chiuso Perso'
    `).get();

    res.json({ funnel, persi });
  } catch (error) {
    res.status(500).json({ error: 'Errore recupero funnel' });
  }
});

// POST /api/pipeline - Crea nuovo deal
router.post('/', (req, res) => {
  try {
    const {
      contatto_id, nome_deal, stage, aum_previsto, fee_percentuale,
      fonte, responsabile, prossima_azione, data_prossima_azione, note
    } = req.body;

    if (!nome_deal) {
      return res.status(400).json({ error: 'Nome deal obbligatorio' });
    }

    const lastId = db.prepare('SELECT MAX(id) as max FROM pipeline').get();
    const newNum = (lastId.max || 0) + 1;
    const pipeline_id = `P-${String(newNum).padStart(4, '0')}`;

    // Probabilità allineate al foglio Excel
    const probabilitaMap = {
      'Prospect': 10, 'Lead': 20, 'Primo Contatto': 40, 'Appuntamento': 60,
      'Secondo Appuntamento': 75, 'Chiusura': 90, 'Cliente Attivo': 100
    };
    const probabilita = probabilitaMap[stage] || 10;
    const feePerc = fee_percentuale || 0.5;
    const fee_stimata = (aum_previsto || 0) * (feePerc / 100);

    const result = db.prepare(`
      INSERT INTO pipeline (pipeline_id, contatto_id, nome_deal, stage, aum_previsto, probabilita, fee_percentuale, fee_stimata, fonte, responsabile, prossima_azione, data_prossima_azione, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(pipeline_id, contatto_id, nome_deal, stage || 'Lead', aum_previsto || 0, probabilita, feePerc, fee_stimata, fonte, responsabile || 'Antonio Tritto', prossima_azione, data_prossima_azione, note);

    if (contatto_id) {
      db.prepare(`
        INSERT INTO timeline (contatto_id, pipeline_id, tipo_interazione, canale, descrizione, sentiment, stage_dopo, cambio_stage)
        VALUES (?, ?, 'Nota', 'Altro', 'Deal creato in pipeline', 'Neutrale', ?, 0)
      `).run(contatto_id, result.lastInsertRowid, stage || 'Lead');
    }

    saveDatabase();
    const newDeal = db.prepare('SELECT * FROM pipeline WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newDeal);
  } catch (error) {
    console.error('Errore creazione deal:', error);
    res.status(500).json({ error: 'Errore nella creazione deal' });
  }
});

// POST /api/pipeline/import - Importa deals
router.post('/import', (req, res) => {
  try {
    const { records } = req.body;
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Records array required' });
    }

    let imported = 0;
    records.forEach(record => {
      try {
        const pipelineId = 'P-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
        const aum = parseInt(record.aum_previsto) || 0;
        const fee = parseFloat(record.fee_percentuale) || 0.5;
        db.prepare(`
          INSERT INTO pipeline (pipeline_id, nome_deal, stage, aum_previsto, probabilita, fee_percentuale, fee_stimata, fonte, data_creazione)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'))
        `).run(pipelineId, record.nome_deal, record.stage || 'Lead', aum, parseInt(record.probabilita) || 10, fee, aum * fee / 100, record.fonte || '');
        imported++;
      } catch (e) {
        console.error('Import row error:', e.message);
      }
    });

    saveDatabase();
    res.json({ success: true, imported });
  } catch (error) {
    res.status(500).json({ error: 'Errore importazione' });
  }
});

// POST /api/pipeline/bulk-delete
router.post('/bulk-delete', (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'IDs array required' });
    }

    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM pipeline WHERE id IN (${placeholders})`).run(...ids);

    saveDatabase();
    res.json({ success: true, deleted: ids.length });
  } catch (error) {
    res.status(500).json({ error: 'Errore eliminazione' });
  }
});

// ===== ROUTE CON PARAMETRI /:id =====

// GET /api/pipeline/:id - Singolo deal
router.get('/:id', (req, res) => {
  try {
    const deal = db.prepare(`
      SELECT p.*, c.nome || ' ' || COALESCE(c.cognome, '') as contatto_nome, c.azienda, c.email, c.telefono, c.categoria
      FROM pipeline p
      LEFT JOIN contatti c ON p.contatto_id = c.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!deal) {
      return res.status(404).json({ error: 'Deal non trovato' });
    }

    const timeline = db.prepare(`
      SELECT * FROM timeline WHERE pipeline_id = ? ORDER BY data_interazione DESC
    `).all(req.params.id);

    const contratti = db.prepare(`
      SELECT * FROM contratti WHERE pipeline_id = ?
    `).all(req.params.id);

    res.json({ deal, timeline, contratti });
  } catch (error) {
    res.status(500).json({ error: 'Errore recupero deal' });
  }
});

// PUT /api/pipeline/:id - Aggiorna deal
router.put('/:id', (req, res) => {
  try {
    const deal = db.prepare('SELECT * FROM pipeline WHERE id = ?').get(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal non trovato' });
    }

    const {
      nome_deal, stage, aum_previsto, fee_percentuale,
      responsabile, prossima_azione, data_prossima_azione, note, motivo_perdita
    } = req.body;

    const stageChanged = stage && stage !== deal.stage;

    // Probabilità allineate al foglio Excel
    const probabilitaMap = {
      'Prospect': 10, 'Lead': 20, 'Primo Contatto': 40, 'Appuntamento': 60,
      'Secondo Appuntamento': 75, 'Chiusura': 90, 'Cliente Attivo': 100, 'Chiuso Perso': 0
    };
    const probabilita = stage ? probabilitaMap[stage] : deal.probabilita;
    const aum = aum_previsto !== undefined ? aum_previsto : deal.aum_previsto;
    const feePerc = fee_percentuale !== undefined ? fee_percentuale : deal.fee_percentuale;
    const fee_stimata = aum * (feePerc / 100);

    db.prepare(`
      UPDATE pipeline SET
        nome_deal = COALESCE(?, nome_deal),
        stage = COALESCE(?, stage),
        aum_previsto = ?,
        probabilita = ?,
        fee_percentuale = ?,
        fee_stimata = ?,
        responsabile = COALESCE(?, responsabile),
        prossima_azione = COALESCE(?, prossima_azione),
        data_prossima_azione = COALESCE(?, data_prossima_azione),
        note = COALESCE(?, note),
        motivo_perdita = COALESCE(?, motivo_perdita),
        data_ultimo_avanzamento = CASE WHEN ? THEN date('now') ELSE data_ultimo_avanzamento END,
        giorni_in_stage = CASE WHEN ? THEN 0 ELSE giorni_in_stage END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nome_deal, stage, aum, probabilita, feePerc, fee_stimata, responsabile, prossima_azione, data_prossima_azione, note, motivo_perdita, stageChanged ? 1 : 0, stageChanged ? 1 : 0, req.params.id);

    if (stageChanged && deal.contatto_id) {
      db.prepare(`
        INSERT INTO timeline (contatto_id, pipeline_id, tipo_interazione, canale, descrizione, sentiment, stage_prima, stage_dopo, cambio_stage)
        VALUES (?, ?, 'Nota', 'Altro', ?, 'Neutrale', ?, ?, 1)
      `).run(deal.contatto_id, req.params.id, `Avanzamento da ${deal.stage} a ${stage}`, deal.stage, stage);

      if (stage === 'Cliente Attivo') {
        db.prepare('UPDATE contatti SET is_cliente = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(deal.contatto_id);
      }
    }

    saveDatabase();
    const updated = db.prepare('SELECT * FROM pipeline WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Errore aggiornamento deal:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento deal' });
  }
});

// POST /api/pipeline/:id/avanza - Avanza stage
router.post('/:id/avanza', (req, res) => {
  try {
    const deal = db.prepare('SELECT * FROM pipeline WHERE id = ?').get(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal non trovato' });
    }

    // Stadi allineati al foglio Excel
    const stages = ['Prospect', 'Lead', 'Primo Contatto', 'Appuntamento', 'Secondo Appuntamento', 'Chiusura', 'Cliente Attivo'];
    const currentIndex = stages.indexOf(deal.stage);

    if (currentIndex === -1 || currentIndex >= stages.length - 1) {
      return res.status(400).json({ error: 'Impossibile avanzare oltre Cliente Attivo' });
    }

    const newStage = stages[currentIndex + 1];
    req.body.stage = newStage;

    router.handle({ ...req, method: 'PUT' }, res);
  } catch (error) {
    res.status(500).json({ error: 'Errore avanzamento stage' });
  }
});

// DELETE /api/pipeline/:id - Elimina deal
router.delete('/:id', (req, res) => {
  try {
    const deal = db.prepare('SELECT * FROM pipeline WHERE id = ?').get(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal non trovato' });
    }

    db.prepare('DELETE FROM pipeline WHERE id = ?').run(req.params.id);
    saveDatabase();
    res.json({ message: 'Deal eliminato', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Errore eliminazione deal' });
  }
});

module.exports = router;
