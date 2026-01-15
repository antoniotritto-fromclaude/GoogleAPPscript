/**
 * Contatti API Routes
 * Gestione database contatti
 */

const express = require('express');
const router = express.Router();
const { db } = require('../models/database');

// GET /api/contatti - Lista tutti i contatti
router.get('/', (req, res) => {
  try {
    const { tier, categoria, is_cliente, search, limit = 100, offset = 0 } = req.query;

    let query = `SELECT * FROM contatti WHERE 1=1`;
    const params = [];

    if (tier) {
      query += ` AND tier = ?`;
      params.push(tier);
    }
    if (categoria) {
      query += ` AND categoria = ?`;
      params.push(categoria);
    }
    if (is_cliente !== undefined) {
      query += ` AND is_cliente = ?`;
      params.push(is_cliente === 'true' ? 1 : 0);
    }
    if (search) {
      query += ` AND (nome LIKE ? OR cognome LIKE ? OR azienda LIKE ? OR email LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    query += ` ORDER BY tier, engagement_score DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const contatti = db.prepare(query).all(...params);

    // Count totale
    let countQuery = `SELECT COUNT(*) as total FROM contatti WHERE 1=1`;
    const countParams = [];
    if (tier) { countQuery += ` AND tier = ?`; countParams.push(tier); }
    if (categoria) { countQuery += ` AND categoria = ?`; countParams.push(categoria); }
    if (is_cliente !== undefined) { countQuery += ` AND is_cliente = ?`; countParams.push(is_cliente === 'true' ? 1 : 0); }
    if (search) {
      countQuery += ` AND (nome LIKE ? OR cognome LIKE ? OR azienda LIKE ? OR email LIKE ?)`;
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam, searchParam);
    }

    const total = db.prepare(countQuery).get(...countParams);

    res.json({ contatti, total: total.total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Errore contatti:', error);
    res.status(500).json({ error: 'Errore nel recupero contatti' });
  }
});

// GET /api/contatti/:id - Singolo contatto
router.get('/:id', (req, res) => {
  try {
    const contatto = db.prepare('SELECT * FROM contatti WHERE id = ?').get(req.params.id);
    if (!contatto) {
      return res.status(404).json({ error: 'Contatto non trovato' });
    }

    // Pipeline associata
    const pipeline = db.prepare('SELECT * FROM pipeline WHERE contatto_id = ?').all(req.params.id);

    // Contratti associati
    const contratti = db.prepare('SELECT * FROM contratti WHERE contatto_id = ?').all(req.params.id);

    // Timeline
    const timeline = db.prepare('SELECT * FROM timeline WHERE contatto_id = ? ORDER BY data_interazione DESC').all(req.params.id);

    // Chiamate
    const chiamate = db.prepare('SELECT * FROM chiamate WHERE contatto_id = ? ORDER BY data_chiamata DESC').all(req.params.id);

    // AUM
    const aum = db.prepare('SELECT * FROM registro_aum WHERE contatto_id = ? ORDER BY data_operazione DESC').all(req.params.id);

    res.json({ contatto, pipeline, contratti, timeline, chiamate, aum });
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero contatto' });
  }
});

// POST /api/contatti - Crea nuovo contatto
router.post('/', (req, res) => {
  try {
    const {
      nome, cognome, azienda, ruolo, email, telefono, cellulare,
      linkedin, categoria, tier, fonte, engagement_score, aum_potenziale, note
    } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome obbligatorio' });
    }

    const result = db.prepare(`
      INSERT INTO contatti (nome, cognome, azienda, ruolo, email, telefono, cellulare, linkedin, categoria, tier, fonte, engagement_score, aum_potenziale, note, data_primo_contatto)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'))
    `).run(nome, cognome, azienda, ruolo, email, telefono, cellulare, linkedin, categoria, tier || 'C', fonte, engagement_score || 5, aum_potenziale || 0, note);

    const newContatto = db.prepare('SELECT * FROM contatti WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newContatto);
  } catch (error) {
    console.error('Errore creazione contatto:', error);
    res.status(500).json({ error: 'Errore nella creazione contatto' });
  }
});

// PUT /api/contatti/:id - Aggiorna contatto
router.put('/:id', (req, res) => {
  try {
    const contatto = db.prepare('SELECT * FROM contatti WHERE id = ?').get(req.params.id);
    if (!contatto) {
      return res.status(404).json({ error: 'Contatto non trovato' });
    }

    const {
      nome, cognome, azienda, ruolo, email, telefono, cellulare,
      linkedin, categoria, tier, fonte, engagement_score, aum_potenziale, is_cliente, note
    } = req.body;

    db.prepare(`
      UPDATE contatti SET
        nome = COALESCE(?, nome),
        cognome = COALESCE(?, cognome),
        azienda = COALESCE(?, azienda),
        ruolo = COALESCE(?, ruolo),
        email = COALESCE(?, email),
        telefono = COALESCE(?, telefono),
        cellulare = COALESCE(?, cellulare),
        linkedin = COALESCE(?, linkedin),
        categoria = COALESCE(?, categoria),
        tier = COALESCE(?, tier),
        fonte = COALESCE(?, fonte),
        engagement_score = COALESCE(?, engagement_score),
        aum_potenziale = COALESCE(?, aum_potenziale),
        is_cliente = COALESCE(?, is_cliente),
        note = COALESCE(?, note),
        data_ultimo_contatto = date('now'),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nome, cognome, azienda, ruolo, email, telefono, cellulare, linkedin, categoria, tier, fonte, engagement_score, aum_potenziale, is_cliente, note, req.params.id);

    const updated = db.prepare('SELECT * FROM contatti WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'aggiornamento contatto' });
  }
});

// DELETE /api/contatti/:id - Elimina contatto
router.delete('/:id', (req, res) => {
  try {
    const contatto = db.prepare('SELECT * FROM contatti WHERE id = ?').get(req.params.id);
    if (!contatto) {
      return res.status(404).json({ error: 'Contatto non trovato' });
    }

    db.prepare('DELETE FROM contatti WHERE id = ?').run(req.params.id);
    res.json({ message: 'Contatto eliminato', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Errore nell\'eliminazione contatto' });
  }
});

// GET /api/contatti/stats/categorie - Statistiche per categoria
router.get('/stats/categorie', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT categoria, COUNT(*) as count,
        SUM(CASE WHEN is_cliente = 1 THEN 1 ELSE 0 END) as clienti,
        AVG(engagement_score) as engagement_medio,
        SUM(aum_potenziale) as aum_potenziale_totale
      FROM contatti
      GROUP BY categoria
      ORDER BY count DESC
    `).all();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Errore statistiche' });
  }
});

module.exports = router;
