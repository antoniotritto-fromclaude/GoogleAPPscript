/**
 * Seed Data Inline - Per reset database da admin
 */

function seed(db) {
  // Configurazione
  const configData = [
    ['email_notifiche', 'antonio@antoniotritto.com', 'string', 'Email per notifiche'],
    ['giorni_alert_follow_up', '3', 'number', 'Giorni per alert follow-up'],
    ['giorni_alert_contratto', '7', 'number', 'Giorni per alert contratto'],
    ['soglia_pipeline_stallo', '14', 'number', 'Giorni per stallo pipeline'],
    ['aum_minimo_target', '50000', 'number', 'AUM minimo target'],
    ['fee_media', '0.5', 'number', 'Fee percentuale media']
  ];

  const insertConfig = db.prepare('INSERT OR REPLACE INTO configurazione (chiave, valore, tipo, descrizione) VALUES (?, ?, ?, ?)');
  configData.forEach(row => insertConfig.run(...row));

  // Contatti di esempio
  const contatti = [
    ['Marco', 'Rossi', 'Rossi Costruzioni SRL', 'CEO', 'marco.rossi@rossisrl.it', '335-1234567', 'Imprenditore', 'A+', 'Newsletter', 9, 500000, 1],
    ['Laura', 'Bianchi', 'Studio Bianchi', 'Titolare', 'laura.bianchi@studiob.it', '336-2345678', 'Commercialista', 'A', 'Cold Calling', 8, 300000, 1],
    ['Giuseppe', 'Verdi', 'Verdi & Partners', 'Managing Partner', 'g.verdi@verdilaw.it', '337-3456789', 'Avvocato', 'A', 'Partnership', 7, 250000, 1],
    ['Anna', 'Ferrari', 'Clinica Dentale Ferrari', 'Direttore', 'anna.ferrari@clinicaferrari.it', '338-4567890', 'Odontoiatra', 'A+', 'Evento Libro', 9, 400000, 1],
    ['Roberto', 'Colombo', 'Colombo Immobiliare', 'Amministratore', 'r.colombo@colomboim.it', '339-5678901', 'Imprenditore', 'B', 'Newsletter', 6, 150000, 0],
    ['Francesca', 'Ricci', 'Farmacia Ricci', 'Titolare', 'f.ricci@farmaciaricci.it', '340-6789012', 'Farmacista', 'A', 'TFR Entry', 8, 200000, 1],
    ['Alessandro', 'Moretti', 'Moretti Tech', 'CTO', 'a.moretti@morettitech.it', '341-7890123', 'Manager', 'B', 'Cold Calling', 5, 120000, 0],
    ['Giulia', 'Romano', 'Studio Notarile Romano', 'Notaio', 'g.romano@notaioromano.it', '342-8901234', 'Notaio', 'A', 'Partnership', 7, 350000, 1],
    ['Stefano', 'Conti', 'Ospedale San Carlo', 'Primario', 's.conti@sancarlo.it', '343-9012345', 'Medico', 'A+', 'Percorso Formativo', 8, 450000, 1],
    ['Elena', 'Galli', 'Galli Consulting', 'Partner', 'e.galli@galliconsulting.it', '344-0123456', 'Manager', 'B', 'Newsletter', 6, 180000, 0]
  ];

  const insertContatto = db.prepare(`
    INSERT INTO contatti (nome, cognome, azienda, ruolo, email, cellulare, categoria, tier, fonte, engagement_score, aum_potenziale, is_cliente, data_primo_contatto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now', '-90 days'))
  `);
  contatti.forEach(row => insertContatto.run(...row));

  // Pipeline
  const pipelineData = [
    [1, 'Deal Marco Rossi', 'Cliente Attivo', 500000, 100, 'Newsletter'],
    [2, 'Deal Laura Bianchi', 'Cliente Attivo', 300000, 100, 'Cold Calling'],
    [3, 'Deal Giuseppe Verdi', 'Cliente Attivo', 250000, 100, 'Partnership'],
    [4, 'Deal Anna Ferrari', 'Cliente Attivo', 400000, 100, 'Evento Libro'],
    [5, 'Deal Roberto Colombo', 'Negoziazione', 150000, 75, 'Newsletter'],
    [6, 'Deal Francesca Ricci', 'Cliente Attivo', 200000, 100, 'TFR Entry'],
    [7, 'Deal Alessandro Moretti', 'Proposta Inviata', 120000, 60, 'Cold Calling'],
    [8, 'Deal Giulia Romano', 'Cliente Attivo', 350000, 100, 'Partnership'],
    [9, 'Deal Stefano Conti', 'Cliente Attivo', 450000, 100, 'Percorso Formativo'],
    [10, 'Deal Elena Galli', 'Qualificato', 180000, 40, 'Newsletter']
  ];

  const insertPipeline = db.prepare(`
    INSERT INTO pipeline (pipeline_id, contatto_id, nome_deal, stage, aum_previsto, probabilita, fee_percentuale, fee_stimata, fonte, data_creazione, giorni_in_stage)
    VALUES (?, ?, ?, ?, ?, ?, 0.5, ?, ?, date('now', '-45 days'), ?)
  `);
  pipelineData.forEach((row, i) => {
    const pipelineId = 'P-' + String(i + 1).padStart(4, '0');
    const feeStimata = row[3] * 0.005;
    const giorniInStage = Math.floor(Math.random() * 20);
    insertPipeline.run(pipelineId, row[0], row[1], row[2], row[3], row[4], feeStimata, row[5], giorniInStage);
  });

  // Contratti
  const contratti = [
    [1, 1, 'Marco Rossi', 'Gestione Patrimonio', 500000, 0.5, 2500, 'Attivo'],
    [2, 2, 'Laura Bianchi', 'Consulenza Finanziaria', 300000, 0.4, 1200, 'Attivo'],
    [3, 3, 'Giuseppe Verdi', 'Gestione Patrimonio', 250000, 0.5, 1250, 'Attivo'],
    [4, 4, 'Anna Ferrari', 'Piano Pensionistico', 400000, 0.45, 1800, 'Attivo'],
    [5, 6, 'Francesca Ricci', 'TFR Aziendale', 200000, 0.3, 600, 'Attivo'],
    [6, 8, 'Giulia Romano', 'Investimenti', 350000, 0.5, 1750, 'Attivo'],
    [7, 9, 'Stefano Conti', 'Gestione Patrimonio', 450000, 0.55, 2475, 'Attivo']
  ];

  const insertContratto = db.prepare(`
    INSERT INTO contratti (contratto_id, pipeline_id, contatto_id, cliente_nome, tipo_contratto, aum, fee_percentuale, fee_annuale, stato, data_creazione, durata_mesi, data_scadenza, rinnovo_automatico)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, date('now', '-60 days'), 12, date('now', '+300 days'), 1)
  `);
  contratti.forEach((row, i) => {
    const contrattoId = 'CTR-2025-' + String(i + 1).padStart(3, '0');
    insertContratto.run(contrattoId, row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7]);
  });

  // Chiamate
  const chiamate = [
    [1, 1, 'Marco Rossi', 'Check-in Cliente', 'Completato', 'Alto', 15],
    [2, 2, 'Laura Bianchi', 'Follow-up', 'Completato', 'Alto', 10],
    [5, 5, 'Roberto Colombo', 'Negoziazione', 'Interessato', 'Alto', 25],
    [7, 7, 'Alessandro Moretti', 'Presentazione', 'Info Richieste', 'Medio', 20],
    [10, 10, 'Elena Galli', 'Discovery Call', 'Interessato', 'Medio', 15]
  ];

  const insertChiamata = db.prepare(`
    INSERT INTO chiamate (chiamata_id, contatto_id, pipeline_id, contatto_nome, tipo_chiamata, esito, livello_interesse, durata_minuti, data_chiamata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now', '-10 days'))
  `);
  chiamate.forEach((row, i) => {
    const chiamataId = 'CALL-' + String(i + 1).padStart(4, '0');
    insertChiamata.run(chiamataId, row[0], row[1], row[2], row[3], row[4], row[5], row[6]);
  });

  // AUM
  const aumOperazioni = [
    [1, 1, 'Marco Rossi', 'Nuova Acquisizione', 0, 500000, 500000],
    [2, 2, 'Laura Bianchi', 'Nuova Acquisizione', 0, 300000, 300000],
    [3, 3, 'Giuseppe Verdi', 'Nuova Acquisizione', 0, 250000, 250000],
    [4, 4, 'Anna Ferrari', 'Nuova Acquisizione', 0, 400000, 400000],
    [6, 5, 'Francesca Ricci', 'Nuova Acquisizione', 0, 200000, 200000],
    [8, 6, 'Giulia Romano', 'Nuova Acquisizione', 0, 350000, 350000],
    [9, 7, 'Stefano Conti', 'Nuova Acquisizione', 0, 450000, 450000]
  ];

  const insertAUM = db.prepare(`
    INSERT INTO registro_aum (contatto_id, contratto_id, cliente_nome, tipo_operazione, aum_precedente, variazione, aum_nuovo, data_operazione)
    VALUES (?, ?, ?, ?, ?, ?, ?, date('now', '-30 days'))
  `);
  aumOperazioni.forEach(row => insertAUM.run(...row));

  // Canali
  const canali = [
    ['Newsletter', 'W01-2025', 45, 12, 4, 350000, 500, 125, 600],
    ['Cold Calling', 'W01-2025', 80, 18, 3, 220000, 200, 67, 1000],
    ['Partnership', 'W01-2025', 25, 8, 3, 380000, 300, 100, 1167],
    ['Evento Libro', 'W01-2025', 35, 10, 2, 280000, 800, 400, 250],
    ['TFR Entry', 'W01-2025', 20, 6, 2, 200000, 150, 75, 1233],
    ['Percorso Formativo', 'W01-2025', 15, 5, 1, 150000, 400, 400, 275]
  ];

  const insertCanale = db.prepare(`
    INSERT INTO canali_acquisizione (canale, settimana, leads_generati, contatti_qualificati, clienti_acquisiti, aum_acquisito, costo, cac, roi_percentuale)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  canali.forEach(row => insertCanale.run(...row));

  // Funnel
  const funnel = [
    ['W01-2025', 2025, 120, 85, 25, 42, 18, 12, 8, 6, 580000, 2900, 83, 1100],
    ['W02-2025', 2025, 135, 92, 28, 48, 22, 15, 10, 7, 680000, 3400, 79, 1180],
    ['W03-2025', 2025, 110, 78, 22, 38, 16, 10, 7, 5, 420000, 2100, 88, 950],
    ['W04-2025', 2025, 145, 98, 32, 55, 25, 18, 12, 9, 850000, 4250, 72, 1320]
  ];

  const insertFunnel = db.prepare(`
    INSERT INTO funnel_settimanale (settimana, anno, leads_totali, chiamate_effettuate, meeting_fissati, qualificati, proposte_inviate, contratti_inviati, contratti_firmati, clienti_attivi, aum_settimanale, fee_settimanale, cac, roi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  funnel.forEach(row => insertFunnel.run(...row));

  console.log('✅ Seed data inseriti');
}

module.exports = { seed };
