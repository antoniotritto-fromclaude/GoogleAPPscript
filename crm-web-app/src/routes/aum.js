/**
 * AUM (Assets Under Management) API Routes
 * Gestione patrimonio gestito
 */

const express = require('express');
const router = express.Router();
const { db } = require('../models/database');

// GET /api/aum - Lista operazioni AUM
router.get('/', (req, res) => {
  try {
    const { tipo_operazione, cliente_nome, limit = 100, offset = 0 } = req.query;

    let query = `SELECT * FROM registro_aum WHERE 1=1`;
    const params = [];

    if (tipo_operazione) {
      query += ` AND tipo_operazione = ?`;
      params.push(tipo_operazione);
    }
    if (cliente_nome) {
      query += ` AND cliente_nome LIKE ?`;
      params.push(`%${cliente_nome}%`);
    }

    query += ` ORDER BY data_operazione DESC, id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const operazioni = db.prepare(query).all(...params);
    res.json(operazioni);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero operazioni AUM' });
  }
});

// GET /api/aum/summary - Riepilogo AUM
router.get('/summary', (req, res) => {
  try {
    // AUM totale attuale (ultimo valore per ogni cliente)
    const aumTotale = db.prepare(`
      SELECT COALESCE(SUM(last_aum), 0) as totale
      FROM (
        SELECT cliente_nome, aum_nuovo as last_aum
        FROM registro_aum r1
        WHERE id = (SELECT MAX(id) FROM registro_aum r2 WHERE r2.cliente_nome = r1.cliente_nome)
      )
    `).get();

    // Operazioni per tipo
    const perTipo = db.prepare(`
      SELECT tipo_operazione, COUNT(*) as count, COALESCE(SUM(variazione), 0) as totale_variazione
      FROM registro_aum
      GROUP BY tipo_operazione
    `).all();

    // AUM per cliente
    const perCliente = db.prepare(`
      SELECT cliente_nome, aum_nuovo as aum_attuale,
        (SELECT SUM(variazione) FROM registro_aum r2 WHERE r2.cliente_nome = r1.cliente_nome AND tipo_operazione LIKE 'Performance%') as performance_totale
      FROM registro_aum r1
      WHERE id = (SELECT MAX(id) FROM registro_aum r2 WHERE r2.cliente_nome = r1.cliente_nome)
      ORDER BY aum_nuovo DESC
    `).all();

    // Trend mensile
    const trendMensile = db.prepare(`
      SELECT strftime('%Y-%m', data_operazione) as mese,
        SUM(CASE WHEN tipo_operazione IN ('Nuova Acquisizione', 'Versamento Aggiuntivo', 'Trasferimento In') THEN variazione ELSE 0 END) as entrate,
        SUM(CASE WHEN tipo_operazione IN ('Prelievo Parziale', 'Trasferimento Out', 'Chiusura Account') THEN ABS(variazione) ELSE 0 END) as uscite,
        SUM(CASE WHEN tipo_operazione = 'Performance Positiva' THEN variazione ELSE 0 END) as performance_positiva,
        SUM(CASE WHEN tipo_operazione = 'Performance Negativa' THEN ABS(variazione) ELSE 0 END) as performance_negativa
      FROM registro_aum
      WHERE data_operazione >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', data_operazione)
      ORDER BY mese
    `).all();

    // Statistiche generali
    const stats = db.prepare(`
      SELECT
        COUNT(DISTINCT cliente_nome) as clienti_totali,
        COUNT(*) as operazioni_totali,
        COALESCE(AVG(variazione), 0) as variazione_media,
        COALESCE(SUM(CASE WHEN tipo_operazione = 'Nuova Acquisizione' THEN variazione ELSE 0 END), 0) as totale_acquisizioni
      FROM registro_aum
    `).get();

    res.json({
      aumTotale: aumTotale.totale,
      perTipo,
      perCliente,
      trendMensile,
      stats
    });
  } catch (error) {
    console.error('Errore summary AUM:', error);
    res.status(500).json({ error: 'Errore nel recupero summary AUM' });
  }
});

// GET /api/aum/cliente/:id - AUM per cliente specifico
router.get('/cliente/:id', (req, res) => {
  try {
    const operazioni = db.prepare(`
      SELECT * FROM registro_aum WHERE contatto_id = ? ORDER BY data_operazione DESC, id DESC
    `).all(req.params.id);

    const aumAttuale = operazioni.length > 0 ? operazioni[0].aum_nuovo : 0;

    const stats = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN tipo_operazione = 'Versamento Aggiuntivo' THEN variazione ELSE 0 END), 0) as versamenti,
        COALESCE(SUM(CASE WHEN tipo_operazione = 'Prelievo Parziale' THEN variazione ELSE 0 END), 0) as prelievi,
        COALESCE(SUM(CASE WHEN tipo_operazione LIKE 'Performance%' THEN variazione ELSE 0 END), 0) as performance_totale
      FROM registro_aum WHERE contatto_id = ?
    `).get(req.params.id);

    res.json({ aumAttuale, operazioni, stats });
  } catch (error) {
    res.status(500).json({ error: 'Errore recupero AUM cliente' });
  }
});

// POST /api/aum - Registra nuova operazione AUM
router.post('/', (req, res) => {
  try {
    const {
      contatto_id, contratto_id, cliente_nome, tipo_operazione,
      variazione, performance_percentuale, note
    } = req.body;

    if (!cliente_nome || !tipo_operazione) {
      return res.status(400).json({ error: 'Cliente e tipo operazione obbligatori' });
    }

    // Ottieni ultimo AUM del cliente
    const ultimoAum = db.prepare(`
      SELECT aum_nuovo FROM registro_aum WHERE cliente_nome = ? ORDER BY data_operazione DESC, id DESC LIMIT 1
    `).get(cliente_nome);

    const aum_precedente = ultimoAum ? ultimoAum.aum_nuovo : 0;
    const variazioneVal = variazione || 0;
    const aum_nuovo = aum_precedente + variazioneVal;

    const result = db.prepare(`
      INSERT INTO registro_aum (contatto_id, contratto_id, cliente_nome, tipo_operazione, aum_precedente, variazione, aum_nuovo, performance_percentuale, note, data_operazione)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'))
    `).run(contatto_id, contratto_id, cliente_nome, tipo_operazione, aum_precedente, variazioneVal, aum_nuovo, performance_percentuale || 0, note);

    const newOperazione = db.prepare('SELECT * FROM registro_aum WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newOperazione);
  } catch (error) {
    console.error('Errore registrazione AUM:', error);
    res.status(500).json({ error: 'Errore nella registrazione AUM' });
  }
});

// GET /api/aum/report/mensile - Report mensile AUM
router.get('/report/mensile', (req, res) => {
  try {
    const { mese } = req.query;
    const meseFilter = mese || new Date().toISOString().slice(0, 7);

    const report = db.prepare(`
      SELECT
        tipo_operazione,
        COUNT(*) as numero_operazioni,
        COALESCE(SUM(variazione), 0) as totale_variazione,
        COALESCE(AVG(variazione), 0) as media_variazione
      FROM registro_aum
      WHERE strftime('%Y-%m', data_operazione) = ?
      GROUP BY tipo_operazione
    `).all(meseFilter);

    const totali = db.prepare(`
      SELECT
        COUNT(*) as operazioni,
        COALESCE(SUM(CASE WHEN variazione > 0 THEN variazione ELSE 0 END), 0) as entrate,
        COALESCE(SUM(CASE WHEN variazione < 0 THEN ABS(variazione) ELSE 0 END), 0) as uscite,
        COALESCE(SUM(variazione), 0) as netto
      FROM registro_aum
      WHERE strftime('%Y-%m', data_operazione) = ?
    `).get(meseFilter);

    res.json({ mese: meseFilter, report, totali });
  } catch (error) {
    res.status(500).json({ error: 'Errore report mensile AUM' });
  }
});

module.exports = router;
