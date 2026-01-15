/**
 * Chiamate API Routes
 * Gestione chiamate e follow-up
 */

const express = require('express');
const router = express.Router();
const { db } = require('../models/database');

// GET /api/chiamate - Lista chiamate
router.get('/', (req, res) => {
  try {
    const { esito, tipo_chiamata, data_da, data_a, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT ch.*, c.email, c.telefono, c.azienda
      FROM chiamate ch
      LEFT JOIN contatti c ON ch.contatto_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (esito) {
      query += ` AND ch.esito = ?`;
      params.push(esito);
    }
    if (tipo_chiamata) {
      query += ` AND ch.tipo_chiamata = ?`;
      params.push(tipo_chiamata);
    }
    if (data_da) {
      query += ` AND ch.data_chiamata >= ?`;
      params.push(data_da);
    }
    if (data_a) {
      query += ` AND ch.data_chiamata <= ?`;
      params.push(data_a);
    }

    query += ` ORDER BY ch.data_chiamata DESC, ch.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const chiamate = db.prepare(query).all(...params);
    res.json(chiamate);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero chiamate' });
  }
});

// GET /api/chiamate/oggi - Chiamate da fare oggi
router.get('/oggi', (req, res) => {
  try {
    const followUpOggi = db.prepare(`
      SELECT ch.*, c.email, c.telefono, c.azienda
      FROM chiamate ch
      LEFT JOIN contatti c ON ch.contatto_id = c.id
      WHERE ch.data_follow_up = date('now') AND ch.follow_up_completato = 0
      ORDER BY ch.livello_interesse DESC
    `).all();

    const followUpScaduti = db.prepare(`
      SELECT ch.*, c.email, c.telefono, c.azienda,
        julianday('now') - julianday(ch.data_follow_up) as giorni_scaduto
      FROM chiamate ch
      LEFT JOIN contatti c ON ch.contatto_id = c.id
      WHERE ch.data_follow_up < date('now') AND ch.follow_up_completato = 0
      ORDER BY ch.data_follow_up
    `).all();

    res.json({ followUpOggi, followUpScaduti });
  } catch (error) {
    res.status(500).json({ error: 'Errore recupero chiamate oggi' });
  }
});

// GET /api/chiamate/stats - Statistiche chiamate
router.get('/stats', (req, res) => {
  try {
    const oggi = db.prepare(`
      SELECT COUNT(*) as count FROM chiamate WHERE data_chiamata = date('now')
    `).get();

    const settimana = db.prepare(`
      SELECT COUNT(*) as count FROM chiamate WHERE data_chiamata >= date('now', '-7 days')
    `).get();

    const mese = db.prepare(`
      SELECT COUNT(*) as count FROM chiamate WHERE data_chiamata >= date('now', '-30 days')
    `).get();

    const perEsito = db.prepare(`
      SELECT esito, COUNT(*) as count
      FROM chiamate
      WHERE data_chiamata >= date('now', '-30 days')
      GROUP BY esito
      ORDER BY count DESC
    `).all();

    const perTipo = db.prepare(`
      SELECT tipo_chiamata, COUNT(*) as count
      FROM chiamate
      WHERE data_chiamata >= date('now', '-30 days')
      GROUP BY tipo_chiamata
      ORDER BY count DESC
    `).all();

    const perQualita = db.prepare(`
      SELECT qualita, COUNT(*) as count
      FROM chiamate
      WHERE data_chiamata >= date('now', '-30 days')
      GROUP BY qualita
    `).all();

    const durataTotale = db.prepare(`
      SELECT COALESCE(SUM(durata_minuti), 0) as totale, COALESCE(AVG(durata_minuti), 0) as media
      FROM chiamate
      WHERE data_chiamata >= date('now', '-30 days')
    `).get();

    const conversionRate = db.prepare(`
      SELECT
        CAST(SUM(CASE WHEN esito IN ('Interessato', 'Appuntamento Fissato') THEN 1 ELSE 0 END) AS FLOAT) /
        NULLIF(COUNT(*), 0) * 100 as tasso
      FROM chiamate
      WHERE data_chiamata >= date('now', '-30 days')
    `).get();

    res.json({
      chiamateOggi: oggi.count,
      chiamateSettimana: settimana.count,
      chiamateMese: mese.count,
      perEsito,
      perTipo,
      perQualita,
      durataTotale: durataTotale.totale,
      durataMedia: Math.round(durataTotale.media),
      tassoConversione: Math.round((conversionRate.tasso || 0) * 10) / 10
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore statistiche chiamate' });
  }
});

// GET /api/chiamate/:id - Singola chiamata
router.get('/:id', (req, res) => {
  try {
    const chiamata = db.prepare(`
      SELECT ch.*, c.nome || ' ' || COALESCE(c.cognome, '') as contatto_completo, c.email, c.telefono, c.azienda
      FROM chiamate ch
      LEFT JOIN contatti c ON ch.contatto_id = c.id
      WHERE ch.id = ?
    `).get(req.params.id);

    if (!chiamata) {
      return res.status(404).json({ error: 'Chiamata non trovata' });
    }

    res.json(chiamata);
  } catch (error) {
    res.status(500).json({ error: 'Errore recupero chiamata' });
  }
});

// POST /api/chiamate - Registra nuova chiamata
router.post('/', (req, res) => {
  try {
    const {
      contatto_id, pipeline_id, contatto_nome, tipo_chiamata, esito,
      qualita, livello_interesse, durata_minuti, data_follow_up, note, prossimi_passi
    } = req.body;

    if (!contatto_nome) {
      return res.status(400).json({ error: 'Nome contatto obbligatorio' });
    }

    // Genera chiamata_id
    const lastId = db.prepare('SELECT MAX(id) as max FROM chiamate').get();
    const newNum = (lastId.max || 0) + 1;
    const chiamata_id = `CALL-${String(newNum).padStart(4, '0')}`;

    // Calcola data follow-up automatica se non specificata
    let followUpDate = data_follow_up;
    if (!followUpDate && esito) {
      if (esito === 'Interessato' || esito === 'Info Richieste') {
        followUpDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else if (esito === 'Richiamare') {
        followUpDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
    }

    const result = db.prepare(`
      INSERT INTO chiamate (chiamata_id, contatto_id, pipeline_id, contatto_nome, tipo_chiamata, esito, qualita, livello_interesse, durata_minuti, data_chiamata, ora_chiamata, data_follow_up, note, prossimi_passi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), time('now'), ?, ?, ?)
    `).run(chiamata_id, contatto_id, pipeline_id, contatto_nome, tipo_chiamata || 'Cold Call', esito, qualita, livello_interesse, durata_minuti || 0, followUpDate, note, prossimi_passi);

    // Registra nella timeline
    if (contatto_id) {
      db.prepare(`
        INSERT INTO timeline (contatto_id, pipeline_id, tipo_interazione, canale, descrizione, sentiment, data_interazione)
        VALUES (?, ?, 'Chiamata', 'Telefono', ?, ?, datetime('now'))
      `).run(
        contatto_id,
        pipeline_id,
        `${tipo_chiamata || 'Chiamata'}: ${esito || 'N/A'} - ${note || ''}`.substring(0, 500),
        livello_interesse === 'Alto' ? 'Molto Positivo' : livello_interesse === 'Medio' ? 'Positivo' : 'Neutrale'
      );

      // Aggiorna data ultimo contatto
      db.prepare('UPDATE contatti SET data_ultimo_contatto = date(\'now\'), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(contatto_id);
    }

    const newChiamata = db.prepare('SELECT * FROM chiamate WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newChiamata);
  } catch (error) {
    console.error('Errore registrazione chiamata:', error);
    res.status(500).json({ error: 'Errore nella registrazione chiamata' });
  }
});

// PUT /api/chiamate/:id - Aggiorna chiamata
router.put('/:id', (req, res) => {
  try {
    const chiamata = db.prepare('SELECT * FROM chiamate WHERE id = ?').get(req.params.id);
    if (!chiamata) {
      return res.status(404).json({ error: 'Chiamata non trovata' });
    }

    const {
      esito, qualita, livello_interesse, durata_minuti,
      data_follow_up, follow_up_completato, note, prossimi_passi
    } = req.body;

    db.prepare(`
      UPDATE chiamate SET
        esito = COALESCE(?, esito),
        qualita = COALESCE(?, qualita),
        livello_interesse = COALESCE(?, livello_interesse),
        durata_minuti = COALESCE(?, durata_minuti),
        data_follow_up = COALESCE(?, data_follow_up),
        follow_up_completato = COALESCE(?, follow_up_completato),
        note = COALESCE(?, note),
        prossimi_passi = COALESCE(?, prossimi_passi)
      WHERE id = ?
    `).run(esito, qualita, livello_interesse, durata_minuti, data_follow_up, follow_up_completato, note, prossimi_passi, req.params.id);

    const updated = db.prepare('SELECT * FROM chiamate WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Errore aggiornamento chiamata' });
  }
});

// POST /api/chiamate/:id/completa-followup - Completa follow-up
router.post('/:id/completa-followup', (req, res) => {
  try {
    const chiamata = db.prepare('SELECT * FROM chiamate WHERE id = ?').get(req.params.id);
    if (!chiamata) {
      return res.status(404).json({ error: 'Chiamata non trovata' });
    }

    db.prepare('UPDATE chiamate SET follow_up_completato = 1 WHERE id = ?').run(req.params.id);

    const updated = db.prepare('SELECT * FROM chiamate WHERE id = ?').get(req.params.id);
    res.json({ message: 'Follow-up completato', chiamata: updated });
  } catch (error) {
    res.status(500).json({ error: 'Errore completamento follow-up' });
  }
});

// DELETE /api/chiamate/:id - Elimina chiamata
router.delete('/:id', (req, res) => {
  try {
    const chiamata = db.prepare('SELECT * FROM chiamate WHERE id = ?').get(req.params.id);
    if (!chiamata) {
      return res.status(404).json({ error: 'Chiamata non trovata' });
    }

    db.prepare('DELETE FROM chiamate WHERE id = ?').run(req.params.id);
    res.json({ message: 'Chiamata eliminata', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Errore eliminazione chiamata' });
  }
});

module.exports = router;
