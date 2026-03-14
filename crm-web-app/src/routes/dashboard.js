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

    // Pipeline per stage (allineato al foglio Excel)
    const pipelinePerStage = db.prepare(`
      SELECT stage, COUNT(*) as count, COALESCE(SUM(aum_previsto), 0) as valore
      FROM pipeline
      WHERE stage NOT IN ('Chiuso Perso')
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

// GET /api/dashboard/revenue - Dashboard Revenue completo (dal foglio Excel)
router.get('/revenue', (req, res) => {
  try {
    // Clienti attivi (tipo_cliente = 'Gia Cliente' o is_cliente = 1)
    const clienti = db.prepare(`
      SELECT COUNT(*) as count FROM contatti
      WHERE is_cliente = 1 OR tipo_cliente = 'Gia Cliente'
    `).get();

    // Pipeline (tipo_cliente = 'Potenziale')
    const pipeline = db.prepare(`
      SELECT COUNT(*) as count FROM contatti
      WHERE tipo_cliente = 'Potenziale' OR (is_cliente = 0 AND tipo_cliente IS NULL)
    `).get();

    // AUM Gestito (somma somma_versata dei clienti)
    const aumGestito = db.prepare(`
      SELECT COALESCE(SUM(somma_versata), 0) as totale FROM contatti
      WHERE is_cliente = 1 OR tipo_cliente = 'Gia Cliente'
    `).get();

    // AUM Pipeline (somma somma_potenziale dei potenziali)
    const aumPipeline = db.prepare(`
      SELECT COALESCE(SUM(somma_potenziale), 0) as totale FROM contatti
      WHERE tipo_cliente = 'Potenziale' OR (is_cliente = 0 AND tipo_cliente IS NULL)
    `).get();

    // Revenue Clienti (somma management_fee + iunp_36)
    const revClienti = db.prepare(`
      SELECT COALESCE(SUM(management_fee), 0) as mgmt, COALESCE(SUM(iunp_36), 0) as iunp FROM contatti
      WHERE is_cliente = 1 OR tipo_cliente = 'Gia Cliente'
    `).get();

    // Revenue Pipeline (calcolata sulla base di probabilita)
    const revPipeline = db.prepare(`
      SELECT COALESCE(SUM(somma_potenziale * probabilita / 100 * 0.0045), 0) as totale FROM contatti
      WHERE tipo_cliente = 'Potenziale' OR (is_cliente = 0 AND tipo_cliente IS NULL)
    `).get();

    // Target (configurabile, default 15M euro)
    let target = db.prepare('SELECT target_aum FROM target_revenue WHERE anno = ?').get(new Date().getFullYear());
    if (!target) {
      target = { target_aum: 15000000 };
    }

    // Revenue per Tipo Fee
    const revPerTipoFee = db.prepare(`
      SELECT
        tipo_fee,
        COALESCE(SUM(management_fee), 0) as management_fee_totale,
        COALESCE(SUM(iunp_36), 0) as iunp_totale,
        COUNT(*) as count
      FROM contatti
      WHERE (is_cliente = 1 OR tipo_cliente = 'Gia Cliente') AND tipo_fee IS NOT NULL
      GROUP BY tipo_fee
    `).all();

    // Breakdown per Cluster
    const perCluster = db.prepare(`
      SELECT
        COALESCE(cluster_cliente, 'Non assegnato') as cluster,
        SUM(CASE WHEN is_cliente = 1 OR tipo_cliente = 'Gia Cliente' THEN 1 ELSE 0 END) as clienti,
        SUM(CASE WHEN tipo_cliente = 'Potenziale' OR (is_cliente = 0 AND tipo_cliente IS NULL) THEN 1 ELSE 0 END) as potenziali,
        COALESCE(SUM(CASE WHEN is_cliente = 1 OR tipo_cliente = 'Gia Cliente' THEN somma_versata ELSE 0 END), 0) as aum_gestito,
        COALESCE(SUM(CASE WHEN tipo_cliente = 'Potenziale' THEN somma_potenziale ELSE 0 END), 0) as aum_pipeline
      FROM contatti
      GROUP BY cluster_cliente
    `).all();

    const revTotale = (revClienti.mgmt + revClienti.iunp) + revPipeline.totale;
    const percentualeTarget = target.target_aum > 0 ? ((aumGestito.totale + aumPipeline.totale) / target.target_aum * 100) : 0;

    res.json({
      kpi: {
        clienti: clienti.count,
        pipeline: pipeline.count,
        aumGestito: aumGestito.totale,
        aumPipeline: aumPipeline.totale,
        revClienti: revClienti.mgmt + revClienti.iunp,
        revPipeline: revPipeline.totale,
        revTotale: revTotale,
        targetAum: target.target_aum,
        percentualeTarget: Math.round(percentualeTarget * 100) / 100
      },
      revenuePerTipoFee: revPerTipoFee,
      breakdownPerCluster: perCluster,
      dettaglioFee: {
        managementFeeRate: 0.45,
        iunpRate: 18,
        managementFeeTotale: revClienti.mgmt,
        iunpTotale: revClienti.iunp
      }
    });
  } catch (error) {
    console.error('Errore dashboard revenue:', error);
    res.status(500).json({ error: 'Errore nel recupero dashboard revenue' });
  }
});

// GET /api/dashboard/conversione - Analisi Conversione Funnel
router.get('/conversione', (req, res) => {
  try {
    // Funnel di conversione per stadio pipeline
    const stadi = ['Prospect', 'Lead', 'Primo Contatto', 'Appuntamento', 'Secondo Appuntamento', 'Chiusura'];
    const totaleContatti = db.prepare('SELECT COUNT(*) as count FROM contatti WHERE tipo_cliente = "Potenziale"').get();

    const funnelPerStadio = stadi.map((stadio, idx) => {
      const count = db.prepare('SELECT COUNT(*) as count FROM contatti WHERE stadio_pipeline = ?').get(stadio);
      const percentualeTotale = totaleContatti.count > 0 ? (count.count / totaleContatti.count * 100) : 0;

      // Conversione stadio (rispetto allo stadio precedente)
      let conversioneStadio = 100;
      if (idx > 0) {
        const stadioPrecedente = stadi[idx - 1];
        const countPrec = db.prepare('SELECT COUNT(*) as count FROM contatti WHERE stadio_pipeline = ?').get(stadioPrecedente);
        conversioneStadio = countPrec.count > 0 ? (count.count / countPrec.count * 100) : 0;
      }

      return {
        stadio,
        count: count.count,
        percentualeTotale: Math.round(percentualeTotale * 100) / 100,
        conversioneStadio: Math.round(conversioneStadio * 100) / 100
      };
    });

    // Clienti acquisiti
    const clientiAcquisiti = db.prepare(`
      SELECT COUNT(*) as count FROM contatti
      WHERE is_cliente = 1 OR tipo_cliente = 'Gia Cliente'
    `).get();

    // Conversione per fonte
    const conversionePerFonte = db.prepare(`
      SELECT
        COALESCE(fonte_acquisizione, fonte, 'Non specificata') as fonte,
        COUNT(*) as totali,
        SUM(CASE WHEN is_cliente = 1 OR tipo_cliente = 'Gia Cliente' THEN 1 ELSE 0 END) as chiusi,
        COALESCE(SUM(CASE WHEN is_cliente = 1 OR tipo_cliente = 'Gia Cliente' THEN somma_versata ELSE 0 END), 0) as aum_chiusi
      FROM contatti
      GROUP BY COALESCE(fonte_acquisizione, fonte)
    `).all();

    conversionePerFonte.forEach(f => {
      f.tassoConversione = f.totali > 0 ? Math.round(f.chiusi / f.totali * 100 * 100) / 100 : 0;
    });

    res.json({
      funnelPerStadio,
      clientiAcquisiti: clientiAcquisiti.count,
      tassoConversioneGlobale: totaleContatti.count > 0 ?
        Math.round(clientiAcquisiti.count / (totaleContatti.count + clientiAcquisiti.count) * 100 * 100) / 100 : 0,
      conversionePerFonte
    });
  } catch (error) {
    console.error('Errore analisi conversione:', error);
    res.status(500).json({ error: 'Errore nel recupero analisi conversione' });
  }
});

// GET /api/dashboard/cashflow - Previsioni Cash Flow 12 mesi
router.get('/cashflow', (req, res) => {
  try {
    const oggi = new Date();
    const mesi = [];

    // Genera previsioni per i prossimi 12 mesi
    for (let i = 0; i < 12; i++) {
      const data = new Date(oggi.getFullYear(), oggi.getMonth() + i, 1);
      const meseStr = data.toISOString().substring(0, 7);
      const nomeMese = data.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

      // Revenue certa (clienti attivi - management fee mensile)
      const revenueCerta = db.prepare(`
        SELECT COALESCE(SUM(management_fee), 0) / 12 as mensile FROM contatti
        WHERE is_cliente = 1 OR tipo_cliente = 'Gia Cliente'
      `).get();

      // Revenue probabile (pipeline con prob >= 70%)
      const revenueProbabile = db.prepare(`
        SELECT COALESCE(SUM(somma_potenziale * probabilita / 100 * 0.0045), 0) / 12 as mensile FROM contatti
        WHERE (tipo_cliente = 'Potenziale') AND probabilita >= 70
      `).get();

      // Revenue potenziale (pipeline con prob < 70%)
      const revenuePotenziale = db.prepare(`
        SELECT COALESCE(SUM(somma_potenziale * probabilita / 100 * 0.0045), 0) / 12 as mensile FROM contatti
        WHERE (tipo_cliente = 'Potenziale') AND probabilita < 70
      `).get();

      mesi.push({
        mese: meseStr,
        nomeMese,
        revenueCerta: Math.round(revenueCerta.mensile * 100) / 100,
        revenueProbabile: Math.round(revenueProbabile.mensile * 100) / 100,
        revenuePotenziale: Math.round(revenuePotenziale.mensile * 100) / 100,
        totale: Math.round((revenueCerta.mensile + revenueProbabile.mensile + revenuePotenziale.mensile) * 100) / 100
      });
    }

    // Revenue ricorrente annuale
    const revenueRicorrente = db.prepare(`
      SELECT COALESCE(SUM(management_fee), 0) as annuale FROM contatti
      WHERE is_cliente = 1 OR tipo_cliente = 'Gia Cliente'
    `).get();

    res.json({
      previsioni: mesi,
      revenueRicorrenteAnnua: revenueRicorrente.annuale,
      revenueRicorrenteMensile: Math.round(revenueRicorrente.annuale / 12 * 100) / 100
    });
  } catch (error) {
    console.error('Errore cashflow:', error);
    res.status(500).json({ error: 'Errore nel recupero previsioni cashflow' });
  }
});

// POST /api/dashboard/target - Imposta target annuale
router.post('/target', (req, res) => {
  try {
    const { anno, target_aum, management_fee_rate, iunp_rate } = req.body;
    const annoTarget = anno || new Date().getFullYear();

    // Verifica se esiste
    const existing = db.prepare('SELECT id FROM target_revenue WHERE anno = ?').get(annoTarget);

    if (existing) {
      db.prepare(`
        UPDATE target_revenue SET target_aum = ?, management_fee_rate = ?, iunp_rate = ?
        WHERE anno = ?
      `).run(
        target_aum || 15000000,
        management_fee_rate || 0.45,
        iunp_rate || 18,
        annoTarget
      );
    } else {
      db.prepare(`
        INSERT INTO target_revenue (anno, target_aum, management_fee_rate, iunp_rate)
        VALUES (?, ?, ?, ?)
      `).run(
        annoTarget,
        target_aum || 15000000,
        management_fee_rate || 0.45,
        iunp_rate || 18
      );
    }

    const { saveDatabase } = require('../models/database');
    saveDatabase();

    res.json({ success: true, message: 'Target salvato' });
  } catch (error) {
    console.error('Errore salvataggio target:', error);
    res.status(500).json({ error: 'Errore nel salvataggio target' });
  }
});

module.exports = router;
