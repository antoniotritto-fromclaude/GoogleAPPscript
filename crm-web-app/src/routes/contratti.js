/**
 * Contratti API Routes
 * Gestione contratti clienti
 */

const express = require('express');
const router = express.Router();
const { db } = require('../models/database');

// GET /api/contratti - Lista contratti
router.get('/', (req, res) => {
  try {
    const { stato, tipo_contratto, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT ct.*, c.email, c.telefono
      FROM contratti ct
      LEFT JOIN contatti c ON ct.contatto_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (stato) {
      query += ` AND ct.stato = ?`;
      params.push(stato);
    }
    if (tipo_contratto) {
      query += ` AND ct.tipo_contratto = ?`;
      params.push(tipo_contratto);
    }

    query += ` ORDER BY ct.data_creazione DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const contratti = db.prepare(query).all(...params);
    res.json(contratti);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero contratti' });
  }
});

// GET /api/contratti/stats - Statistiche contratti
router.get('/stats', (req, res) => {
  try {
    const perStato = db.prepare(`
      SELECT stato, COUNT(*) as count, COALESCE(SUM(aum), 0) as aum_totale, COALESCE(SUM(fee_annuale), 0) as fee_totale
      FROM contratti GROUP BY stato
    `).all();

    const perTipo = db.prepare(`
      SELECT tipo_contratto, COUNT(*) as count, COALESCE(SUM(aum), 0) as aum_totale, COALESCE(SUM(fee_annuale), 0) as fee_totale
      FROM contratti WHERE stato = 'Attivo' GROUP BY tipo_contratto
    `).all();

    const inScadenza = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(aum), 0) as aum_totale
      FROM contratti
      WHERE data_scadenza BETWEEN date('now') AND date('now', '+60 days') AND stato = 'Attivo'
    `).get();

    const totali = db.prepare(`
      SELECT
        COUNT(*) as contratti_totali,
        SUM(CASE WHEN stato = 'Attivo' THEN 1 ELSE 0 END) as contratti_attivi,
        COALESCE(SUM(CASE WHEN stato = 'Attivo' THEN aum ELSE 0 END), 0) as aum_attivo,
        COALESCE(SUM(CASE WHEN stato = 'Attivo' THEN fee_annuale ELSE 0 END), 0) as fee_annuale_totale
      FROM contratti
    `).get();

    res.json({ perStato, perTipo, inScadenza, totali });
  } catch (error) {
    res.status(500).json({ error: 'Errore statistiche contratti' });
  }
});

// GET /api/contratti/:id - Singolo contratto
router.get('/:id', (req, res) => {
  try {
    const contratto = db.prepare(`
      SELECT ct.*, c.nome || ' ' || COALESCE(c.cognome, '') as contatto_nome, c.email, c.telefono, c.azienda
      FROM contratti ct
      LEFT JOIN contatti c ON ct.contatto_id = c.id
      WHERE ct.id = ?
    `).get(req.params.id);

    if (!contratto) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }

    res.json(contratto);
  } catch (error) {
    res.status(500).json({ error: 'Errore recupero contratto' });
  }
});

// POST /api/contratti - Crea nuovo contratto
router.post('/', (req, res) => {
  try {
    const {
      pipeline_id, contatto_id, cliente_nome, tipo_contratto, aum,
      fee_percentuale, stato, durata_mesi, rinnovo_automatico, note
    } = req.body;

    if (!cliente_nome) {
      return res.status(400).json({ error: 'Nome cliente obbligatorio' });
    }

    // Genera contratto_id
    const year = new Date().getFullYear();
    const lastId = db.prepare("SELECT MAX(CAST(SUBSTR(contratto_id, -3) AS INTEGER)) as max FROM contratti WHERE contratto_id LIKE ?").get(`CTR-${year}-%`);
    const newNum = (lastId.max || 0) + 1;
    const contratto_id = `CTR-${year}-${String(newNum).padStart(3, '0')}`;

    const feePerc = fee_percentuale || 0.5;
    const aumVal = aum || 0;
    const fee_annuale = aumVal * (feePerc / 100);
    const durata = durata_mesi || 12;

    const result = db.prepare(`
      INSERT INTO contratti (contratto_id, pipeline_id, contatto_id, cliente_nome, tipo_contratto, aum, fee_percentuale, fee_annuale, stato, durata_mesi, data_scadenza, rinnovo_automatico, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now', '+' || ? || ' months'), ?, ?)
    `).run(contratto_id, pipeline_id, contatto_id, cliente_nome, tipo_contratto || 'Gestione Patrimonio', aumVal, feePerc, fee_annuale, stato || 'Bozza', durata, durata, rinnovo_automatico !== undefined ? rinnovo_automatico : 1, note);

    const newContratto = db.prepare('SELECT * FROM contratti WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newContratto);
  } catch (error) {
    console.error('Errore creazione contratto:', error);
    res.status(500).json({ error: 'Errore nella creazione contratto' });
  }
});

// PUT /api/contratti/:id - Aggiorna contratto
router.put('/:id', (req, res) => {
  try {
    const contratto = db.prepare('SELECT * FROM contratti WHERE id = ?').get(req.params.id);
    if (!contratto) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }

    const {
      cliente_nome, tipo_contratto, aum, fee_percentuale, stato,
      data_invio, data_firma, data_attivazione, durata_mesi, rinnovo_automatico, documento_url, note
    } = req.body;

    const aumVal = aum !== undefined ? aum : contratto.aum;
    const feePerc = fee_percentuale !== undefined ? fee_percentuale : contratto.fee_percentuale;
    const fee_annuale = aumVal * (feePerc / 100);

    db.prepare(`
      UPDATE contratti SET
        cliente_nome = COALESCE(?, cliente_nome),
        tipo_contratto = COALESCE(?, tipo_contratto),
        aum = ?,
        fee_percentuale = ?,
        fee_annuale = ?,
        stato = COALESCE(?, stato),
        data_invio = COALESCE(?, data_invio),
        data_firma = COALESCE(?, data_firma),
        data_attivazione = COALESCE(?, data_attivazione),
        durata_mesi = COALESCE(?, durata_mesi),
        rinnovo_automatico = COALESCE(?, rinnovo_automatico),
        documento_url = COALESCE(?, documento_url),
        note = COALESCE(?, note),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(cliente_nome, tipo_contratto, aumVal, feePerc, fee_annuale, stato, data_invio, data_firma, data_attivazione, durata_mesi, rinnovo_automatico, documento_url, note, req.params.id);

    const updated = db.prepare('SELECT * FROM contratti WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Errore aggiornamento contratto' });
  }
});

// POST /api/contratti/:id/invia - Invia contratto
router.post('/:id/invia', (req, res) => {
  try {
    const contratto = db.prepare('SELECT * FROM contratti WHERE id = ?').get(req.params.id);
    if (!contratto) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }

    db.prepare(`
      UPDATE contratti SET stato = 'Inviato', data_invio = date('now'), updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id);

    const updated = db.prepare('SELECT * FROM contratti WHERE id = ?').get(req.params.id);
    res.json({ message: 'Contratto inviato', contratto: updated });
  } catch (error) {
    res.status(500).json({ error: 'Errore invio contratto' });
  }
});

// POST /api/contratti/:id/firma - Registra firma
router.post('/:id/firma', (req, res) => {
  try {
    const contratto = db.prepare('SELECT * FROM contratti WHERE id = ?').get(req.params.id);
    if (!contratto) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }

    const durata = contratto.durata_mesi || 12;

    db.prepare(`
      UPDATE contratti SET
        stato = 'Attivo',
        data_firma = date('now'),
        data_attivazione = date('now'),
        data_scadenza = date('now', '+' || ? || ' months'),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(durata, req.params.id);

    // Se c'è un contatto associato, segnalo come cliente
    if (contratto.contatto_id) {
      db.prepare('UPDATE contatti SET is_cliente = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(contratto.contatto_id);
    }

    // Registra AUM
    if (contratto.contatto_id && contratto.aum > 0) {
      db.prepare(`
        INSERT INTO registro_aum (contatto_id, contratto_id, cliente_nome, tipo_operazione, aum_precedente, variazione, aum_nuovo, data_operazione)
        VALUES (?, ?, ?, 'Nuova Acquisizione', 0, ?, ?, date('now'))
      `).run(contratto.contatto_id, req.params.id, contratto.cliente_nome, contratto.aum, contratto.aum);
    }

    const updated = db.prepare('SELECT * FROM contratti WHERE id = ?').get(req.params.id);
    res.json({ message: 'Contratto firmato e attivato', contratto: updated });
  } catch (error) {
    console.error('Errore firma contratto:', error);
    res.status(500).json({ error: 'Errore firma contratto' });
  }
});

// DELETE /api/contratti/:id - Elimina contratto
router.delete('/:id', (req, res) => {
  try {
    const contratto = db.prepare('SELECT * FROM contratti WHERE id = ?').get(req.params.id);
    if (!contratto) {
      return res.status(404).json({ error: 'Contratto non trovato' });
    }

    db.prepare('DELETE FROM contratti WHERE id = ?').run(req.params.id);
    res.json({ message: 'Contratto eliminato', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Errore eliminazione contratto' });
  }
});

// POST /api/contratti/import
router.post('/import', (req, res) => {
  try {
    const { records } = req.body;
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Records array required' });
    }

    let imported = 0;
    const year = new Date().getFullYear();
    let lastNum = db.prepare("SELECT MAX(CAST(SUBSTR(contratto_id, -3) AS INTEGER)) as max FROM contratti WHERE contratto_id LIKE ?").get(`CTR-${year}-%`).max || 0;

    records.forEach(record => {
      try {
        lastNum++;
        const contrattoId = `CTR-${year}-${String(lastNum).padStart(3, '0')}`;
        const aum = parseInt(record.aum) || 0;
        const fee = parseFloat(record.fee_percentuale) || 0.5;
        db.prepare(`
          INSERT INTO contratti (contratto_id, cliente_nome, tipo_contratto, aum, fee_percentuale, fee_annuale, stato, durata_mesi, data_scadenza, rinnovo_automatico)
          VALUES (?, ?, ?, ?, ?, ?, 'Bozza', ?, date('now', '+' || ? || ' months'), 1)
        `).run(contrattoId, record.cliente_nome, record.tipo_contratto || 'Gestione Patrimonio', aum, fee, aum * fee / 100, parseInt(record.durata_mesi) || 12, parseInt(record.durata_mesi) || 12);
        imported++;
      } catch (e) {
        console.error('Import row error:', e.message);
      }
    });

    const { saveDatabase } = require('../models/database');
    saveDatabase();
    res.json({ success: true, imported });
  } catch (error) {
    res.status(500).json({ error: 'Errore importazione' });
  }
});

// POST /api/contratti/bulk-delete
router.post('/bulk-delete', (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'IDs array required' });
    }

    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM contratti WHERE id IN (${placeholders})`).run(...ids);

    const { saveDatabase } = require('../models/database');
    saveDatabase();
    res.json({ success: true, deleted: ids.length });
  } catch (error) {
    res.status(500).json({ error: 'Errore eliminazione' });
  }
});

module.exports = router;
