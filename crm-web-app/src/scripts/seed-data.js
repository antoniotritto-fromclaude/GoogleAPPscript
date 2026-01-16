/**
 * Script per popolare il database con dati di esempio
 * CRM Antonio Tritto - Private Banking
 */

const { db, initializeDatabase, saveDatabase } = require('../models/database');

async function seedDatabase() {
  // Inizializza database
  await initializeDatabase();

  console.log('🌱 Popolamento dati di esempio...');

  // Configurazione di base
  const configData = [
    ['email_notifiche', 'antonio@antoniotritto.com', 'string', 'Email per notifiche'],
    ['giorni_alert_follow_up', '3', 'number', 'Giorni per alert follow-up'],
    ['giorni_alert_contratto', '7', 'number', 'Giorni per alert contratto'],
    ['soglia_pipeline_stallo', '14', 'number', 'Giorni per stallo pipeline'],
    ['aum_minimo_target', '50000', 'number', 'AUM minimo target'],
    ['conversione_lead_app', '0.15', 'number', 'Target conversione lead-appuntamento'],
    ['conversione_app_cliente', '0.20', 'number', 'Target conversione appuntamento-cliente'],
    ['aum_target_annuale', '15000000', 'number', 'Target AUM annuale'],
    ['clienti_target_annuale', '150', 'number', 'Target clienti annuale'],
    ['budget_marketing', '10000', 'number', 'Budget marketing annuale'],
    ['cac_target', '67', 'number', 'CAC target'],
    ['fee_media', '0.5', 'number', 'Fee percentuale media']
  ];

  const insertConfig = db.prepare('INSERT OR REPLACE INTO configurazione (chiave, valore, tipo, descrizione) VALUES (?, ?, ?, ?)');
  configData.forEach(row => insertConfig.run(...row));
  console.log('✅ Configurazione inserita');

  // Contatti di esempio
  const contatti = [
    ['Marco', 'Rossi', 'Rossi Costruzioni SRL', 'CEO', 'marco.rossi@rossisrl.it', '02-1234567', '335-1234567', 'linkedin.com/in/marcorossi', 'Imprenditore', 'A+', 'Newsletter', 9, 500000, 1],
    ['Laura', 'Bianchi', 'Studio Bianchi', 'Titolare', 'laura.bianchi@studiob.it', '02-2345678', '336-2345678', 'linkedin.com/in/laurabianchi', 'Commercialista', 'A', 'Cold Calling', 8, 300000, 1],
    ['Giuseppe', 'Verdi', 'Verdi & Partners', 'Managing Partner', 'g.verdi@verdilaw.it', '02-3456789', '337-3456789', 'linkedin.com/in/giuseppeverdi', 'Avvocato', 'A', 'Partnership', 7, 250000, 1],
    ['Anna', 'Ferrari', 'Clinica Dentale Ferrari', 'Direttore Sanitario', 'anna.ferrari@clinicaferrari.it', '02-4567890', '338-4567890', 'linkedin.com/in/annaferrari', 'Odontoiatra', 'A+', 'Evento Libro', 9, 400000, 1],
    ['Roberto', 'Colombo', 'Colombo Immobiliare', 'Amministratore', 'r.colombo@colomboim.it', '02-5678901', '339-5678901', 'linkedin.com/in/robertocolombo', 'Imprenditore', 'B', 'Newsletter', 6, 150000, 0],
    ['Francesca', 'Ricci', 'Farmacia Ricci', 'Titolare', 'f.ricci@farmaciaricci.it', '02-6789012', '340-6789012', 'linkedin.com/in/francescaricci', 'Farmacista', 'A', 'TFR Entry', 8, 200000, 1],
    ['Alessandro', 'Moretti', 'Moretti Tech', 'CTO', 'a.moretti@morettitech.it', '02-7890123', '341-7890123', 'linkedin.com/in/alessandromoretti', 'Manager', 'B', 'Cold Calling', 5, 120000, 0],
    ['Giulia', 'Romano', 'Studio Notarile Romano', 'Notaio', 'g.romano@notaioromano.it', '02-8901234', '342-8901234', 'linkedin.com/in/giuliaromano', 'Notaio', 'A', 'Partnership', 7, 350000, 1],
    ['Stefano', 'Conti', 'Ospedale San Carlo', 'Primario', 's.conti@sancarlo.it', '02-9012345', '343-9012345', 'linkedin.com/in/stefanoconti', 'Medico', 'A+', 'Percorso Formativo', 8, 450000, 1],
    ['Elena', 'Galli', 'Galli Consulting', 'Partner', 'e.galli@galliconsulting.it', '02-0123456', '344-0123456', 'linkedin.com/in/elenagalli', 'Manager', 'B', 'Newsletter', 6, 180000, 0],
    ['Paolo', 'Mancini', 'Mancini Group', 'Fondatore', 'p.mancini@mancinigroup.it', '02-1112223', '345-1112223', 'linkedin.com/in/paolomancini', 'Imprenditore', 'A', 'Evento Libro', 7, 280000, 0],
    ['Chiara', 'Barbieri', 'Studio Barbieri', 'Avvocato Senior', 'c.barbieri@studiobarbieri.it', '02-2223334', '346-2223334', 'linkedin.com/in/chiarabarbieri', 'Avvocato', 'B', 'Cold Calling', 5, 100000, 0],
    ['Matteo', 'Fontana', 'Fontana Automobili', 'Direttore Vendite', 'm.fontana@fontanaauto.it', '02-3334445', '347-3334445', 'linkedin.com/in/matteofontana', 'Dirigente', 'C', 'Newsletter', 4, 80000, 0],
    ['Valentina', 'Costa', 'Costa Medical', 'Amministratore', 'v.costa@costamedical.it', '02-4445556', '348-4445556', 'linkedin.com/in/valentinacosta', 'Medico', 'A', 'Partnership', 7, 220000, 0],
    ['Luca', 'De Luca', 'De Luca & Figli', 'Presidente', 'l.deluca@delucafigli.it', '02-5556667', '349-5556667', 'linkedin.com/in/lucadeluca', 'Imprenditore', 'A+', 'TFR Entry', 9, 600000, 1],
    ['Silvia', 'Martinelli', 'Studio Martinelli', 'Commercialista', 's.martinelli@studiomartinelli.it', '02-6667778', '350-6667778', 'linkedin.com/in/silviamartinelli', 'Commercialista', 'B', 'Newsletter', 5, 90000, 0],
    ['Andrea', 'Santoro', 'Santoro Costruzioni', 'Direttore Generale', 'a.santoro@santorocostr.it', '02-7778889', '351-7778889', 'linkedin.com/in/andreasantoro', 'Dirigente', 'A', 'Evento Libro', 6, 200000, 0],
    ['Federica', 'Gentile', 'Gentile Pharma', 'CEO', 'f.gentile@gentilepharma.it', '02-8889990', '352-8889990', 'linkedin.com/in/federicagentile', 'Farmacista', 'A+', 'Partnership', 8, 380000, 0],
    ['Davide', 'Marchetti', 'Marchetti Law', 'Partner', 'd.marchetti@marchettilaw.it', '02-9990001', '353-9990001', 'linkedin.com/in/davidemarchetti', 'Avvocato', 'B', 'Cold Calling', 4, 70000, 0],
    ['Sara', 'Rinaldi', 'Clinica Rinaldi', 'Direttore', 's.rinaldi@clinicarinaldi.it', '02-0001112', '354-0001112', 'linkedin.com/in/sararinaldi', 'Medico', 'A', 'Percorso Formativo', 7, 260000, 0]
  ];

  const insertContatto = db.prepare(`
    INSERT INTO contatti (nome, cognome, azienda, ruolo, email, telefono, cellulare, linkedin, categoria, tier, fonte, engagement_score, aum_potenziale, is_cliente, data_primo_contatto, data_ultimo_contatto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now', '-90 days'), date('now', '-10 days'))
  `);
  contatti.forEach(row => insertContatto.run(...row));
  console.log('✅ Contatti inseriti: ' + contatti.length);

  // Pipeline di esempio - usando ID formattati in JavaScript
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
    [10, 'Deal Elena Galli', 'Qualificato', 180000, 40, 'Newsletter'],
    [11, 'Deal Paolo Mancini', 'Contratto Inviato', 280000, 85, 'Evento Libro'],
    [12, 'Deal Chiara Barbieri', 'Contatto', 100000, 20, 'Cold Calling'],
    [13, 'Deal Matteo Fontana', 'Lead', 80000, 10, 'Newsletter'],
    [14, 'Deal Valentina Costa', 'Proposta Inviata', 220000, 60, 'Partnership'],
    [15, 'Deal Luca De Luca', 'Cliente Attivo', 600000, 100, 'TFR Entry'],
    [16, 'Deal Silvia Martinelli', 'Contatto', 90000, 20, 'Newsletter'],
    [17, 'Deal Andrea Santoro', 'Qualificato', 200000, 40, 'Evento Libro'],
    [18, 'Deal Federica Gentile', 'Negoziazione', 380000, 75, 'Partnership'],
    [19, 'Deal Davide Marchetti', 'Lead', 70000, 10, 'Cold Calling'],
    [20, 'Deal Sara Rinaldi', 'Contratto Inviato', 260000, 85, 'Percorso Formativo']
  ];

  const insertPipeline = db.prepare(`
    INSERT INTO pipeline (pipeline_id, contatto_id, nome_deal, stage, aum_previsto, probabilita, fee_percentuale, fee_stimata, fonte, data_creazione, data_ultimo_avanzamento, giorni_in_stage)
    VALUES (?, ?, ?, ?, ?, ?, 0.5, ?, ?, date('now', '-45 days'), date('now', '-5 days'), ?)
  `);
  pipelineData.forEach(row => {
    const pipelineId = 'P-' + String(row[0]).padStart(4, '0');
    const feeStimata = row[3] * 0.005;
    const giorniInStage = Math.floor(Math.random() * 20);
    insertPipeline.run(pipelineId, row[0], row[1], row[2], row[3], row[4], feeStimata, row[5], giorniInStage);
  });
  console.log('✅ Pipeline inserita: ' + pipelineData.length + ' deals');

  // Contratti di esempio
  const contratti = [
    [1, 1, 'Marco Rossi', 'Gestione Patrimonio', 500000, 0.5, 2500, 'Attivo'],
    [2, 2, 'Laura Bianchi', 'Consulenza Finanziaria', 300000, 0.4, 1200, 'Attivo'],
    [3, 3, 'Giuseppe Verdi', 'Gestione Patrimonio', 250000, 0.5, 1250, 'Attivo'],
    [4, 4, 'Anna Ferrari', 'Piano Pensionistico', 400000, 0.45, 1800, 'Attivo'],
    [5, 6, 'Francesca Ricci', 'TFR Aziendale', 200000, 0.3, 600, 'Attivo'],
    [6, 8, 'Giulia Romano', 'Investimenti', 350000, 0.5, 1750, 'Attivo'],
    [7, 9, 'Stefano Conti', 'Gestione Patrimonio', 450000, 0.55, 2475, 'Attivo'],
    [8, 15, 'Luca De Luca', 'Consulenza Finanziaria', 600000, 0.5, 3000, 'Attivo'],
    [9, 11, 'Paolo Mancini', 'Gestione Patrimonio', 280000, 0.5, 1400, 'Inviato'],
    [10, 20, 'Sara Rinaldi', 'Piano Pensionistico', 260000, 0.45, 1170, 'Inviato']
  ];

  const insertContratto = db.prepare(`
    INSERT INTO contratti (contratto_id, pipeline_id, contatto_id, cliente_nome, tipo_contratto, aum, fee_percentuale, fee_annuale, stato, data_creazione, data_firma, data_attivazione, durata_mesi, data_scadenza, rinnovo_automatico)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, date('now', '-60 days'), ?, ?, 12, date('now', '+300 days'), 1)
  `);
  contratti.forEach(row => {
    const contrattoId = 'CTR-2025-' + String(row[0]).padStart(3, '0');
    const dataFirma = row[7] === 'Attivo' ? "date('now', '-30 days')" : null;
    const dataAttivazione = row[7] === 'Attivo' ? "date('now', '-25 days')" : null;
    insertContratto.run(contrattoId, row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], dataFirma, dataAttivazione);
  });
  console.log('✅ Contratti inseriti: ' + contratti.length);

  // Registro AUM
  const aumOperazioni = [
    [1, 1, 'Marco Rossi', 'Nuova Acquisizione', 0, 500000, 500000, 0],
    [2, 2, 'Laura Bianchi', 'Nuova Acquisizione', 0, 300000, 300000, 0],
    [3, 3, 'Giuseppe Verdi', 'Nuova Acquisizione', 0, 250000, 250000, 0],
    [4, 4, 'Anna Ferrari', 'Nuova Acquisizione', 0, 400000, 400000, 0],
    [6, 5, 'Francesca Ricci', 'Nuova Acquisizione', 0, 200000, 200000, 0],
    [8, 6, 'Giulia Romano', 'Nuova Acquisizione', 0, 350000, 350000, 0],
    [9, 7, 'Stefano Conti', 'Nuova Acquisizione', 0, 450000, 450000, 0],
    [15, 8, 'Luca De Luca', 'Nuova Acquisizione', 0, 600000, 600000, 0],
    [1, 1, 'Marco Rossi', 'Versamento Aggiuntivo', 500000, 50000, 550000, 0],
    [1, 1, 'Marco Rossi', 'Performance Positiva', 550000, 27500, 577500, 5],
    [2, 2, 'Laura Bianchi', 'Performance Positiva', 300000, 12000, 312000, 4],
    [9, 7, 'Stefano Conti', 'Versamento Aggiuntivo', 450000, 100000, 550000, 0],
    [15, 8, 'Luca De Luca', 'Performance Positiva', 600000, 42000, 642000, 7]
  ];

  const insertAUM = db.prepare(`
    INSERT INTO registro_aum (contatto_id, contratto_id, cliente_nome, tipo_operazione, aum_precedente, variazione, aum_nuovo, performance_percentuale, data_operazione)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now', '-30 days'))
  `);
  aumOperazioni.forEach(row => insertAUM.run(...row));
  console.log('✅ Operazioni AUM inserite: ' + aumOperazioni.length);

  // Chiamate di esempio
  const chiamate = [
    [1, 1, 'Marco Rossi', 'Check-in Cliente', 'Completato', 'Ottima', 'Alto', 15],
    [2, 2, 'Laura Bianchi', 'Follow-up', 'Completato', 'Buona', 'Alto', 10],
    [5, 5, 'Roberto Colombo', 'Negoziazione', 'Interessato', 'Buona', 'Alto', 25],
    [7, 7, 'Alessandro Moretti', 'Presentazione', 'Info Richieste', 'Media', 'Medio', 20],
    [10, 10, 'Elena Galli', 'Discovery Call', 'Interessato', 'Buona', 'Medio', 15],
    [11, 11, 'Paolo Mancini', 'Negoziazione', 'Appuntamento Fissato', 'Ottima', 'Alto', 30],
    [12, 12, 'Chiara Barbieri', 'Cold Call', 'Richiamare', 'Media', 'Basso', 5],
    [13, 13, 'Matteo Fontana', 'Cold Call', 'No Risposta', 'Scarsa', 'Nullo', 0],
    [14, 14, 'Valentina Costa', 'Presentazione', 'Interessato', 'Buona', 'Alto', 20],
    [16, 16, 'Silvia Martinelli', 'Follow-up', 'Richiamare', 'Media', 'Medio', 8],
    [17, 17, 'Andrea Santoro', 'Discovery Call', 'Appuntamento Fissato', 'Ottima', 'Alto', 18],
    [18, 18, 'Federica Gentile', 'Negoziazione', 'Interessato', 'Ottima', 'Alto', 35],
    [19, 19, 'Davide Marchetti', 'Cold Call', 'Non Interessato', 'Scarsa', 'Nullo', 3],
    [20, 20, 'Sara Rinaldi', 'Presentazione', 'Appuntamento Fissato', 'Buona', 'Alto', 22]
  ];

  const insertChiamata = db.prepare(`
    INSERT INTO chiamate (chiamata_id, contatto_id, pipeline_id, contatto_nome, tipo_chiamata, esito, qualita, livello_interesse, durata_minuti, data_chiamata, data_follow_up, follow_up_completato)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, date('now', '-10 days'), ?, ?)
  `);
  chiamate.forEach((row, i) => {
    const chiamataId = 'CALL-' + String(i + 1).padStart(4, '0');
    const needsFollowUp = ['Richiamare', 'Info Richieste', 'Interessato'].includes(row[4]);
    const followUpDate = needsFollowUp ? "date('now', '+7 days')" : null;
    const completed = row[4] === 'Completato' ? 1 : 0;
    insertChiamata.run(chiamataId, row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], followUpDate, completed);
  });
  console.log('✅ Chiamate inserite: ' + chiamate.length);

  // Timeline
  const timeline = [
    [1, 1, 'Chiamata', 'Telefono', 'Prima chiamata di contatto - molto interessato', 'Molto Positivo', null, 'Lead'],
    [1, 1, 'Meeting', 'Di Persona', 'Presentazione completa dei servizi', 'Positivo', 'Lead', 'Qualificato'],
    [1, 1, 'Documento Inviato', 'Email', 'Proposta commerciale inviata', 'Positivo', 'Qualificato', 'Proposta Inviata'],
    [1, 1, 'Contratto', 'Email', 'Contratto firmato - nuovo cliente', 'Molto Positivo', 'Negoziazione', 'Cliente Attivo'],
    [2, 2, 'Chiamata', 'Telefono', 'Cold call iniziale', 'Neutrale', null, 'Lead'],
    [2, 2, 'Video Call', 'Video', 'Meeting di approfondimento', 'Positivo', 'Contatto', 'Qualificato'],
    [5, 5, 'Chiamata', 'Telefono', 'Follow-up dopo evento', 'Positivo', 'Contatto', 'Qualificato'],
    [5, 5, 'Meeting', 'Di Persona', 'Presentazione servizi', 'Positivo', 'Qualificato', 'Proposta Inviata'],
    [11, 11, 'Evento', 'Di Persona', 'Incontrato a presentazione libro', 'Molto Positivo', null, 'Lead'],
    [11, 11, 'Meeting', 'Di Persona', 'Pranzo di lavoro', 'Molto Positivo', 'Qualificato', 'Negoziazione']
  ];

  const insertTimeline = db.prepare(`
    INSERT INTO timeline (contatto_id, pipeline_id, tipo_interazione, canale, descrizione, sentiment, stage_prima, stage_dopo, cambio_stage, data_interazione)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-30 days'))
  `);
  timeline.forEach(row => {
    const cambioStage = (row[6] !== null && row[7] !== null) ? 1 : 0;
    insertTimeline.run(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], cambioStage);
  });
  console.log('✅ Timeline inserita: ' + timeline.length + ' interazioni');

  // Canali Acquisizione
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
  console.log('✅ Canali acquisizione inseriti: ' + canali.length);

  // Funnel Settimanale
  const funnel = [
    ['W01-2025', 2025, 120, 85, 25, 42, 18, 12, 8, 6, 580000, 2900, 83, 1100],
    ['W02-2025', 2025, 135, 92, 28, 48, 22, 15, 10, 7, 680000, 3400, 79, 1180],
    ['W03-2025', 2025, 110, 78, 22, 38, 16, 10, 7, 5, 420000, 2100, 88, 950],
    ['W04-2025', 2025, 145, 98, 32, 55, 25, 18, 12, 9, 850000, 4250, 72, 1320],
    ['W05-2025', 2025, 125, 88, 26, 45, 20, 14, 9, 6, 520000, 2600, 85, 1020],
    ['W06-2025', 2025, 140, 95, 30, 52, 24, 16, 11, 8, 720000, 3600, 76, 1250],
    ['W07-2025', 2025, 118, 82, 24, 40, 18, 12, 8, 6, 480000, 2400, 82, 980],
    ['W08-2025', 2025, 152, 105, 35, 60, 28, 20, 14, 10, 920000, 4600, 68, 1420]
  ];

  const insertFunnel = db.prepare(`
    INSERT INTO funnel_settimanale (settimana, anno, leads_totali, chiamate_effettuate, meeting_fissati, qualificati, proposte_inviate, contratti_inviati, contratti_firmati, clienti_attivi, aum_settimanale, fee_settimanale, cac, roi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  funnel.forEach(row => insertFunnel.run(...row));
  console.log('✅ Funnel settimanale inserito: ' + funnel.length + ' settimane');

  // Salva il database su file
  saveDatabase();

  console.log('\n🎉 Database popolato con successo!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Riepilogo:');
  console.log('   • ' + contatti.length + ' contatti');
  console.log('   • ' + pipelineData.length + ' deal in pipeline');
  console.log('   • ' + contratti.length + ' contratti');
  console.log('   • ' + aumOperazioni.length + ' operazioni AUM');
  console.log('   • ' + chiamate.length + ' chiamate');
  console.log('   • ' + canali.length + ' canali acquisizione');
  console.log('   • ' + funnel.length + ' settimane funnel');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

seedDatabase().catch(err => {
  console.error('❌ Errore seed:', err);
  process.exit(1);
});
