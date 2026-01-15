/**
 * Dashboard API Routes
 * Statistiche e KPI principali
 */

const express = require('express');
const router = express.Router();
const { db } = require('../models/database');

// GET /api/dashboard - Ottieni tutti i KPI
router.get('/', (req, res) => {
  try {
    // AUM Totale (ultimo valore per ogni cliente)
    const aumTotale = db.prepare(`
      SELECT COALESCE(SUM(aum_nuovo), 0) as totale
      FROM (
        SELECT cliente_nome, MAX(id) as max_id, aum_nuovo
        FROM registro_aum
        GROUP BY cliente_nome
      )
    `).get();

    // Clienti attivi
    const clientiAttivi = db.prepare(`
      SELECT COUNT(*) as count FROM contatti WHERE is_cliente = 1
    `).get();

    // Deal in pipeline (esclusi Cliente Attivo e Chiuso Perso)
    const dealAttivi = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(aum_previsto), 0) as valore
      FROM pipeline
      WHERE stage NOT IN ('Cliente Attivo', 'Chiuso Perso')
    `).get();

    // Pipeline per stage
    const pipelinePerStage = db.prepare(`
      SELECT stage, COUNT(*) as count, COALESCE(SUM(aum_previsto), 0) as valore
      FROM pipeline
      WHERE stage NOT IN ('Chiuso Perso')
      GROUP BY stage
      ORDER BY
        CASE stage
          WHEN 'Lead' THEN 1
          WHEN 'Contatto' THEN 2
          WHEN 'Qualificato' THEN 3
          WHEN 'Proposta Inviata' THEN 4
          WHEN 'Negoziazione' THEN 5
          WHEN 'Contratto Inviato' THEN 6
          WHEN 'Contratto Firmato' THEN 7
          WHEN 'Cliente Attivo' THEN 8
        END
    `).all();

    // Contratti attivi
    const contrattiAttivi = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(fee_annuale), 0) as fee_totale
      FROM contratti WHERE stato = 'Attivo'
    `).get();

    // Fee annuale totale
    const feeTotale = db.prepare(`
      SELECT COALESCE(SUM(fee_annuale), 0) as totale FROM contratti WHERE stato = 'Attivo'
    `).get();

    // Chiamate oggi
    const chiamateOggi = db.prepare(`
      SELECT COUNT(*) as count FROM chiamate WHERE data_chiamata = date('now')
    `).get();

    // Follow-up scaduti
    const followUpScaduti = db.prepare(`
      SELECT COUNT(*) as count FROM chiamate
      WHERE data_follow_up < date('now') AND follow_up_completato = 0
    `).get();

    // Deal in stallo (>14 giorni)
    const dealInStallo = db.prepare(`
      SELECT COUNT(*) as count FROM pipeline
      WHERE giorni_in_stage > 14 AND stage NOT IN ('Cliente Attivo', 'Chiuso Perso')
    `).get();

    // Contratti in scadenza (prossimi 60 giorni)
    const contrattiInScadenza = db.prepare(`
      SELECT COUNT(*) as count FROM contratti
      WHERE data_scadenza BETWEEN date('now') AND date('now', '+60 days') AND stato = 'Attivo'
    `).get();

    // Conversione rates
    const conversioneRate = db.prepare(`
      SELECT
        CAST(SUM(CASE WHEN stage = 'Cliente Attivo' THEN 1 ELSE 0 END) AS FLOAT) /
        NULLIF(COUNT(*), 0) * 100 as tasso_conversione
      FROM pipeline
    `).get();

    // Attività ultimi 30 giorni
    const attivita30giorni = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM chiamate WHERE data_chiamata >= date('now', '-30 days')) as chiamate,
        (SELECT COUNT(*) FROM timeline WHERE data_interazione >= datetime('now', '-30 days') AND tipo_interazione = 'Email') as email,
        (SELECT COUNT(*) FROM timeline WHERE data_interazione >= datetime('now', '-30 days') AND tipo_interazione = 'Meeting') as meeting,
        (SELECT COUNT(*) FROM contatti WHERE created_at >= datetime('now', '-30 days')) as nuovi_contatti,
        (SELECT COUNT(*) FROM pipeline WHERE stage = 'Cliente Attivo' AND data_ultimo_avanzamento >= date('now', '-30 days')) as deal_chiusi
    `).get();

    // AUM medio per cliente
    const aumMedio = clientiAttivi.count > 0 ? aumTotale.totale / clientiAttivi.count : 0;

    // Top 5 deal per valore
    const topDeal = db.prepare(`
      SELECT nome_deal, stage, aum_previsto, probabilita
      FROM pipeline
      WHERE stage NOT IN ('Cliente Attivo', 'Chiuso Perso')
      ORDER BY aum_previsto DESC
      LIMIT 5
    `).all();

    // Distribuzione clienti per tier
    const clientiPerTier = db.prepare(`
      SELECT tier, COUNT(*) as count FROM contatti GROUP BY tier ORDER BY tier
    `).all();

    // Trend AUM ultimi 6 mesi
    const trendAUM = db.prepare(`
      SELECT
        strftime('%Y-%m', data_operazione) as mese,
        SUM(CASE WHEN tipo_operazione IN ('Nuova Acquisizione', 'Versamento Aggiuntivo', 'Trasferimento In', 'Performance Positiva') THEN variazione ELSE 0 END) as entrate,
        SUM(CASE WHEN tipo_operazione IN ('Prelievo Parziale', 'Trasferimento Out', 'Performance Negativa', 'Chiusura Account') THEN variazione ELSE 0 END) as uscite
      FROM registro_aum
      WHERE data_operazione >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', data_operazione)
      ORDER BY mese
    `).all();

    res.json({
      kpi: {
        aumTotale: aumTotale.totale,
        clientiAttivi: clientiAttivi.count,
        aumMedio: Math.round(aumMedio),
        dealAttivi: dealAttivi.count,
        valoreInPipeline: dealAttivi.valore,
        contrattiAttivi: contrattiAttivi.count,
        feeTotaleAnnuale: feeTotale.totale,
        tassoConversione: Math.round((conversioneRate.tasso_conversione || 0) * 10) / 10
      },
      alerts: {
        chiamateOggi: chiamateOggi.count,
        followUpScaduti: followUpScaduti.count,
        dealInStallo: dealInStallo.count,
        contrattiInScadenza: contrattiInScadenza.count
      },
      attivita30giorni,
      pipelinePerStage,
      topDeal,
      clientiPerTier,
      trendAUM
    });

  } catch (error) {
    console.error('Errore dashboard:', error);
    res.status(500).json({ error: 'Errore nel recupero dashboard' });
  }
});

// GET /api/dashboard/alerts - Dettaglio alert
router.get('/alerts', (req, res) => {
  try {
    const followUpScaduti = db.prepare(`
      SELECT c.*, co.nome || ' ' || COALESCE(co.cognome, '') as contatto_completo
      FROM chiamate c
      LEFT JOIN contatti co ON c.contatto_id = co.id
      WHERE c.data_follow_up < date('now') AND c.follow_up_completato = 0
      ORDER BY c.data_follow_up
    `).all();

    const dealInStallo = db.prepare(`
      SELECT p.*, c.nome || ' ' || COALESCE(c.cognome, '') as contatto_completo
      FROM pipeline p
      LEFT JOIN contatti c ON p.contatto_id = c.id
      WHERE p.giorni_in_stage > 14 AND p.stage NOT IN ('Cliente Attivo', 'Chiuso Perso')
      ORDER BY p.giorni_in_stage DESC
    `).all();

    const contrattiInScadenza = db.prepare(`
      SELECT *, julianday(data_scadenza) - julianday('now') as giorni_rimanenti
      FROM contratti
      WHERE data_scadenza BETWEEN date('now') AND date('now', '+60 days') AND stato = 'Attivo'
      ORDER BY data_scadenza
    `).all();

    res.json({ followUpScaduti, dealInStallo, contrattiInScadenza });
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero alert' });
  }
});

// GET /api/dashboard/performance - Performance agenti
router.get('/performance', (req, res) => {
  try {
    const performance = db.prepare(`
      SELECT
        responsabile,
        COUNT(*) as deal_totali,
        SUM(CASE WHEN stage = 'Cliente Attivo' THEN 1 ELSE 0 END) as deal_chiusi,
        SUM(CASE WHEN stage = 'Cliente Attivo' THEN aum_previsto ELSE 0 END) as aum_acquisito,
        AVG(CASE WHEN stage = 'Cliente Attivo' THEN aum_previsto END) as aum_medio
      FROM pipeline
      GROUP BY responsabile
    `).all();

    const chiamatePerAgente = db.prepare(`
      SELECT
        'Antonio Tritto' as agente,
        COUNT(*) as chiamate_totali,
        SUM(CASE WHEN esito = 'Interessato' OR esito = 'Appuntamento Fissato' THEN 1 ELSE 0 END) as chiamate_positive,
        AVG(durata_minuti) as durata_media
      FROM chiamate
      WHERE data_chiamata >= date('now', '-30 days')
    `).all();

    res.json({ performance, chiamatePerAgente });
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero performance' });
  }
});

module.exports = router;
