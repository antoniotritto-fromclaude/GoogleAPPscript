/**
 * Analytics API Routes
 * Report e analisi avanzate
 */

const express = require('express');
const router = express.Router();
const { db } = require('../models/database');

// GET /api/analytics/overview - Overview completa
router.get('/overview', (req, res) => {
  try {
    // KPI principali
    const kpi = db.prepare(`
      SELECT
        (SELECT COALESCE(SUM(aum), 0) FROM contratti WHERE stato = 'Attivo') as aum_totale,
        (SELECT COUNT(*) FROM contatti WHERE is_cliente = 1) as clienti_attivi,
        (SELECT COUNT(*) FROM pipeline WHERE stage NOT IN ('Cliente Attivo', 'Chiuso Perso')) as deal_aperti,
        (SELECT COALESCE(SUM(aum_previsto), 0) FROM pipeline WHERE stage NOT IN ('Cliente Attivo', 'Chiuso Perso')) as pipeline_value,
        (SELECT COALESCE(SUM(fee_annuale), 0) FROM contratti WHERE stato = 'Attivo') as fee_annuali,
        (SELECT COUNT(*) FROM contratti WHERE stato = 'Attivo') as contratti_attivi
    `).get();

    // Performance conversione
    const conversione = db.prepare(`
      SELECT
        COUNT(*) as deal_totali,
        SUM(CASE WHEN stage = 'Cliente Attivo' THEN 1 ELSE 0 END) as vinti,
        SUM(CASE WHEN stage = 'Chiuso Perso' THEN 1 ELSE 0 END) as persi,
        CAST(SUM(CASE WHEN stage = 'Cliente Attivo' THEN 1 ELSE 0 END) AS FLOAT) /
          NULLIF(SUM(CASE WHEN stage IN ('Cliente Attivo', 'Chiuso Perso') THEN 1 ELSE 0 END), 0) * 100 as win_rate
      FROM pipeline
    `).get();

    // Velocity (tempo medio per stage)
    const velocity = db.prepare(`
      SELECT
        AVG(CASE WHEN stage = 'Qualificato' THEN giorni_in_stage END) as lead_to_qualified,
        AVG(CASE WHEN stage = 'Proposta Inviata' THEN giorni_in_stage END) as qualified_to_proposal,
        AVG(CASE WHEN stage = 'Cliente Attivo' THEN giorni_in_stage END) as proposal_to_close,
        AVG(giorni_in_stage) as media_generale
      FROM pipeline
    `).get();

    res.json({ kpi, conversione, velocity });
  } catch (error) {
    res.status(500).json({ error: 'Errore analytics overview' });
  }
});

// GET /api/analytics/funnel - Analisi funnel
router.get('/funnel', (req, res) => {
  try {
    const funnel = db.prepare(`
      SELECT * FROM funnel_settimanale ORDER BY anno DESC, settimana DESC LIMIT 12
    `).all();

    const medie = db.prepare(`
      SELECT
        AVG(leads_totali) as media_leads,
        AVG(chiamate_effettuate) as media_chiamate,
        AVG(meeting_fissati) as media_meeting,
        AVG(qualificati) as media_qualificati,
        AVG(proposte_inviate) as media_proposte,
        AVG(contratti_firmati) as media_contratti,
        AVG(aum_settimanale) as media_aum,
        AVG(cac) as media_cac
      FROM funnel_settimanale
    `).get();

    // Tassi di conversione funnel
    const conversioniFunnel = db.prepare(`
      SELECT
        CAST(SUM(meeting_fissati) AS FLOAT) / NULLIF(SUM(chiamate_effettuate), 0) * 100 as chiamate_to_meeting,
        CAST(SUM(qualificati) AS FLOAT) / NULLIF(SUM(meeting_fissati), 0) * 100 as meeting_to_qualified,
        CAST(SUM(proposte_inviate) AS FLOAT) / NULLIF(SUM(qualificati), 0) * 100 as qualified_to_proposal,
        CAST(SUM(contratti_firmati) AS FLOAT) / NULLIF(SUM(proposte_inviate), 0) * 100 as proposal_to_close
      FROM funnel_settimanale
    `).get();

    res.json({ funnel, medie, conversioniFunnel });
  } catch (error) {
    res.status(500).json({ error: 'Errore analytics funnel' });
  }
});

// GET /api/analytics/canali - Performance canali acquisizione
router.get('/canali', (req, res) => {
  try {
    const canali = db.prepare(`
      SELECT
        canale,
        SUM(leads_generati) as leads_totali,
        SUM(contatti_qualificati) as qualificati_totali,
        SUM(clienti_acquisiti) as clienti_totali,
        SUM(aum_acquisito) as aum_totale,
        SUM(costo) as costo_totale,
        AVG(cac) as cac_medio,
        AVG(roi_percentuale) as roi_medio
      FROM canali_acquisizione
      GROUP BY canale
      ORDER BY aum_totale DESC
    `).all();

    // Calcola conversion rate per canale
    const canaliConConversione = canali.map(c => ({
      ...c,
      conversion_rate: c.leads_totali > 0 ? (c.clienti_totali / c.leads_totali * 100).toFixed(1) : 0,
      aum_per_cliente: c.clienti_totali > 0 ? Math.round(c.aum_totale / c.clienti_totali) : 0
    }));

    res.json(canaliConConversione);
  } catch (error) {
    res.status(500).json({ error: 'Errore analytics canali' });
  }
});

// GET /api/analytics/clienti - Analisi clienti
router.get('/clienti', (req, res) => {
  try {
    // Distribuzione per tier
    const perTier = db.prepare(`
      SELECT tier, COUNT(*) as count,
        SUM(aum_potenziale) as aum_potenziale,
        AVG(engagement_score) as engagement_medio
      FROM contatti
      GROUP BY tier
      ORDER BY
        CASE tier WHEN 'A+' THEN 1 WHEN 'A' THEN 2 WHEN 'B' THEN 3 WHEN 'C' THEN 4 END
    `).all();

    // Distribuzione per categoria
    const perCategoria = db.prepare(`
      SELECT categoria, COUNT(*) as count,
        SUM(CASE WHEN is_cliente = 1 THEN 1 ELSE 0 END) as clienti,
        SUM(aum_potenziale) as aum_potenziale
      FROM contatti
      WHERE categoria IS NOT NULL
      GROUP BY categoria
      ORDER BY count DESC
    `).all();

    // Distribuzione per fonte
    const perFonte = db.prepare(`
      SELECT fonte, COUNT(*) as count,
        SUM(CASE WHEN is_cliente = 1 THEN 1 ELSE 0 END) as clienti
      FROM contatti
      WHERE fonte IS NOT NULL
      GROUP BY fonte
      ORDER BY count DESC
    `).all();

    // Top clienti per AUM
    const topClienti = db.prepare(`
      SELECT c.id, c.nome || ' ' || COALESCE(c.cognome, '') as nome_completo, c.azienda, c.tier,
        COALESCE((
          SELECT aum_nuovo FROM registro_aum WHERE cliente_nome = c.nome || ' ' || COALESCE(c.cognome, '')
          ORDER BY data_operazione DESC, id DESC LIMIT 1
        ), 0) as aum_attuale
      FROM contatti c
      WHERE c.is_cliente = 1
      ORDER BY aum_attuale DESC
      LIMIT 10
    `).all();

    res.json({ perTier, perCategoria, perFonte, topClienti });
  } catch (error) {
    res.status(500).json({ error: 'Errore analytics clienti' });
  }
});

// GET /api/analytics/attivita - Report attività
router.get('/attivita', (req, res) => {
  try {
    const { giorni = 30 } = req.query;

    // Chiamate per giorno
    const chiamatePerGiorno = db.prepare(`
      SELECT data_chiamata as data, COUNT(*) as count
      FROM chiamate
      WHERE data_chiamata >= date('now', '-' || ? || ' days')
      GROUP BY data_chiamata
      ORDER BY data_chiamata
    `).all(giorni);

    // Interazioni per tipo
    const interazioniPerTipo = db.prepare(`
      SELECT tipo_interazione, COUNT(*) as count
      FROM timeline
      WHERE data_interazione >= datetime('now', '-' || ? || ' days')
      GROUP BY tipo_interazione
      ORDER BY count DESC
    `).all(giorni);

    // Pipeline movimenti
    const movimentiPipeline = db.prepare(`
      SELECT data_ultimo_avanzamento as data, COUNT(*) as count
      FROM pipeline
      WHERE data_ultimo_avanzamento >= date('now', '-' || ? || ' days')
      GROUP BY data_ultimo_avanzamento
      ORDER BY data_ultimo_avanzamento
    `).all(giorni);

    // Contratti creati
    const contrattiCreati = db.prepare(`
      SELECT strftime('%Y-%m-%d', data_creazione) as data, COUNT(*) as count
      FROM contratti
      WHERE data_creazione >= date('now', '-' || ? || ' days')
      GROUP BY strftime('%Y-%m-%d', data_creazione)
      ORDER BY data
    `).all(giorni);

    // Summary
    const summary = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM chiamate WHERE data_chiamata >= date('now', '-' || ? || ' days')) as chiamate_totali,
        (SELECT COUNT(*) FROM timeline WHERE data_interazione >= datetime('now', '-' || ? || ' days')) as interazioni_totali,
        (SELECT COUNT(*) FROM contatti WHERE created_at >= datetime('now', '-' || ? || ' days')) as nuovi_contatti,
        (SELECT COUNT(*) FROM pipeline WHERE data_creazione >= date('now', '-' || ? || ' days')) as nuovi_deal,
        (SELECT COUNT(*) FROM contratti WHERE data_firma >= date('now', '-' || ? || ' days')) as contratti_firmati
    `).get(giorni, giorni, giorni, giorni, giorni);

    res.json({
      periodo: `Ultimi ${giorni} giorni`,
      chiamatePerGiorno,
      interazioniPerTipo,
      movimentiPipeline,
      contrattiCreati,
      summary
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore analytics attività' });
  }
});

// GET /api/analytics/previsioni - Previsioni revenue
router.get('/previsioni', (req, res) => {
  try {
    // Pipeline weighted value
    const pipelineWeighted = db.prepare(`
      SELECT
        stage,
        COUNT(*) as count,
        SUM(aum_previsto) as valore_nominale,
        SUM(aum_previsto * probabilita / 100) as valore_ponderato,
        SUM(aum_previsto * probabilita / 100 * fee_percentuale / 100) as fee_ponderata
      FROM pipeline
      WHERE stage NOT IN ('Cliente Attivo', 'Chiuso Perso')
      GROUP BY stage
      ORDER BY
        CASE stage
          WHEN 'Lead' THEN 1 WHEN 'Contatto' THEN 2 WHEN 'Qualificato' THEN 3
          WHEN 'Proposta Inviata' THEN 4 WHEN 'Negoziazione' THEN 5
          WHEN 'Contratto Inviato' THEN 6 WHEN 'Contratto Firmato' THEN 7
        END
    `).all();

    const totali = db.prepare(`
      SELECT
        SUM(aum_previsto) as valore_nominale_totale,
        SUM(aum_previsto * probabilita / 100) as valore_ponderato_totale,
        SUM(aum_previsto * probabilita / 100 * fee_percentuale / 100) as fee_ponderata_totale
      FROM pipeline
      WHERE stage NOT IN ('Cliente Attivo', 'Chiuso Perso')
    `).get();

    // Contratti in rinnovo
    const rinnovi = db.prepare(`
      SELECT
        strftime('%Y-%m', data_scadenza) as mese,
        COUNT(*) as contratti,
        SUM(aum) as aum_totale,
        SUM(fee_annuale) as fee_totale
      FROM contratti
      WHERE stato = 'Attivo' AND data_scadenza >= date('now') AND data_scadenza <= date('now', '+6 months')
      GROUP BY strftime('%Y-%m', data_scadenza)
      ORDER BY mese
    `).all();

    res.json({ pipelineWeighted, totali, rinnovi });
  } catch (error) {
    res.status(500).json({ error: 'Errore analytics previsioni' });
  }
});

module.exports = router;
