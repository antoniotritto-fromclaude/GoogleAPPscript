/**
 * ═══════════════════════════════════════════════════════════════════
 * FUNZIONI COMPLEMENTARI - Gestione e Automazioni
 * ═══════════════════════════════════════════════════════════════════
 * Questo file contiene le funzioni operative del CRM
 */

// ═══════════════════════════════════════════════════════════════════
// SETUP CANALI ACQUISIZIONE
// ═══════════════════════════════════════════════════════════════════

function setupCanaliAcquisizione(ss) {
  if (!ss) {
    throw new Error('Spreadsheet object is undefined in setupCanaliAcquisizione');
  }

  try {
    setupNewsletter(ss);
    setupColdCalling(ss);
    setupPartnership(ss);
    setupTFREntry(ss);
    setupEventiLibro(ss);
    setupPercorsiFormativi(ss);
  } catch (error) {
    Logger.log('Errore in setupCanaliAcquisizione: ' + error);
    throw error;
  }
}

function setupNewsletter(ss) {
  const sheet = ss.getSheetByName('NEWSLETTER');
  if (!sheet) {
    throw new Error('Sheet NEWSLETTER non trovato. Esegui prima la creazione degli sheet.');
  }
  sheet.clear();

  const headers = ['#', 'Data Invio', 'Oggetto', 'Invii', 'Aperture', 'Open %', 'Click', 'Click %', 'Lead', 'Clienti', 'AUM', 'Note'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#FFFF00').setFontColor('#000000');
  sheet.setFrozenRows(1);

  sheet.getRange('F2').setFormula('=IF(E2>0,E2/D2,"")');
  sheet.getRange('H2').setFormula('=IF(G2>0,G2/E2,"")');
  sheet.getRange('F2:F100').setNumberFormat('0.0%');
  sheet.getRange('H2:H100').setNumberFormat('0.0%');
  sheet.getRange('K2:K100').setNumberFormat('#,##0€');

  sheet.getRange('F2:H2').copyTo(sheet.getRange('F3:H100'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);
}

function setupColdCalling(ss) {
  const sheet = ss.getSheetByName('COLD CALLING');
  sheet.clear();

  const headers = ['Data', 'Nome', 'Tel', 'Categoria', 'Esito', 'Interesse', 'Follow-up?', 'Data Follow-up', 'Note'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#FF9900').setFontColor('#000000');
  sheet.setFrozenRows(1);
}

function setupPartnership(ss) {
  const sheet = ss.getSheetByName('PARTNERSHIP');
  sheet.clear();

  const headers = ['Partner', 'Tipo', 'Città', 'Contatto', 'Data Attivazione', 'Referral Inviati', 'Clienti Acquisiti', 'AUM Totale', 'Status', 'Note'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#9900FF').setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  sheet.getRange('H2:H100').setNumberFormat('#,##0€');
}

function setupTFREntry(ss) {
  const sheet = ss.getSheetByName('TFR ENTRY');
  sheet.clear();

  const headers = ['Azienda', 'N° Dipendenti', 'Data Contatto', 'Adesioni', 'Clienti Acquisiti', 'AUM Totale', 'Status', 'Note'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#FF0000').setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  sheet.getRange('F2:F100').setNumberFormat('#,##0€');
}

function setupEventiLibro(ss) {
  const sheet = ss.getSheetByName('EVENTI LIBRO');
  sheet.clear();

  const headers = ['Data', 'Location', 'Tema', 'Partecipanti', 'Contatti Raccolti', 'Clienti Acquisiti', 'AUM', 'Note'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#A64D79').setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  sheet.getRange('G2:G100').setNumberFormat('#,##0€');
}

function setupPercorsiFormativi(ss) {
  const sheet = ss.getSheetByName('PERCORSI FORMATIVI');
  sheet.clear();

  const headers = ['Percorso', 'Data Inizio', 'Partecipanti', 'Ore Erogate', 'Consulenze', 'Clienti Acquisiti', 'AUM', 'Note'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#00FFFF').setFontColor('#000000');
  sheet.setFrozenRows(1);
  sheet.getRange('G2:G100').setNumberFormat('#,##0€');
}

// ═══════════════════════════════════════════════════════════════════
// SETUP DASHBOARD COMPLETO
// ═══════════════════════════════════════════════════════════════════

function setupDashboardCompleto(ss) {
  const sheet = ss.getSheetByName('DASHBOARD');
  sheet.clear();

  // TITOLO PRINCIPALE
  sheet.getRange('A1:J1').merge();
  sheet.getRange('A1').setValue('🎯 CRM ECOSISTEMA ACQUISIZIONE CLIENTI - DASHBOARD OPERATIVO');
  sheet.getRange('A1').setFontSize(20).setFontWeight('bold').setHorizontalAlignment('center');
  sheet.getRange('A1').setBackground('#1155CC').setFontColor('#FFFFFF');
  sheet.setRowHeight(1, 50);

  // SEZIONE 1: KPI PRINCIPALI
  sheet.getRange('A3').setValue('📊 KPI PRINCIPALI').setFontSize(14).setFontWeight('bold');

  const kpiHeaders = ['METRICA', 'VALORE', 'TARGET', 'GAP', 'STATUS'];
  sheet.getRange(5, 1, 1, 5).setValues([kpiHeaders]);
  sheet.getRange('A5:E5').setFontWeight('bold').setBackground('#434343').setFontColor('#FFFFFF');

  const kpiData = [
    ['💰 AUM Totale', '="REGISTRO AUM"!B10005', '=CONFIGURAZIONE!B22', '=B6-C6', '=IF(B6>=C6*0.8,"✅",IF(B6>=C6*0.5,"⚠️","❌"))'],
    ['👥 Clienti Attivi', '=COUNTIF("DATABASE CONTATTI"!N:N,"SÌ")', '=CONFIGURAZIONE!B23', '=B7-C7', '=IF(B7>=C7*0.8,"✅",IF(B7>=C7*0.5,"⚠️","❌"))'],
    ['🔄 Deal in Pipeline', '=PIPELINE!B1007', 50, '=B8-C8', '=IF(B8>=C8,"✅","⚠️")'],
    ['📈 Conversione %', '=PIPELINE!B1011', '=CONFIGURAZIONE!B40', '=B9-C9', '=IF(B9>=C9,"✅","❌")'],
    ['💼 Contratti Attivi', '=COUNTIF("GESTIONE CONTRATTI"!J:J,"Attivo")', 100, '=B10-C10', '=IF(B10>=C10*0.7,"✅","⚠️")']
  ];
  sheet.getRange(6, 1, kpiData.length, 5).setValues(kpiData);

  sheet.getRange('B6:B10').setNumberFormat('#,##0');
  sheet.getRange('C6:C10').setNumberFormat('#,##0');
  sheet.getRange('D6:D10').setNumberFormat('+#,##0;-#,##0');
  sheet.getRange('B9').setNumberFormat('0.0%');
  sheet.getRange('C9').setNumberFormat('0.0%');

  // SEZIONE 2: ATTIVITÀ QUESTA SETTIMANA
  sheet.getRange('A14').setValue('📅 ATTIVITÀ QUESTA SETTIMANA').setFontSize(14).setFontWeight('bold');

  const attivitaData = [
    ['Chiamate Effettuate', '=COUNTIFS("CHIAMATE & FOLLOW-UP"!B:B,">="&TODAY()-WEEKDAY(TODAY())+1)'],
    ['Meeting Tenuti', '=COUNTIFS("TIMELINE INTERAZIONI"!F:F,"Meeting","TIMELINE INTERAZIONI"!B:B,">="&TODAY()-WEEKDAY(TODAY())+1)'],
    ['Email Inviate', '=COUNTIFS("TIMELINE INTERAZIONI"!F:F,"Email","TIMELINE INTERAZIONI"!B:B,">="&TODAY()-WEEKDAY(TODAY())+1)'],
    ['Nuovi Contatti', '=COUNTIFS("DATABASE CONTATTI"!K:K,">="&TODAY()-WEEKDAY(TODAY())+1)'],
    ['Deal Chiusi', '=COUNTIFS(PIPELINE!H:H,"Cliente Attivo",PIPELINE!R:R,">="&TODAY()-WEEKDAY(TODAY())+1)']
  ];
  sheet.getRange(16, 1, attivitaData.length, 2).setValues(attivitaData);
  sheet.getRange('A16:A20').setFontWeight('bold');

  // SEZIONE 3: PIPELINE PER STAGE
  sheet.getRange('G3').setValue('🎯 PIPELINE PER STAGE').setFontSize(14).setFontWeight('bold');

  const stageHeaders = ['STAGE', 'NUMERO', 'VALORE €'];
  sheet.getRange(5, 7, 1, 3).setValues([stageHeaders]);
  sheet.getRange('G5:I5').setFontWeight('bold').setBackground('#434343').setFontColor('#FFFFFF');

  const stageData = [
    ['Lead', '=COUNTIF(PIPELINE!H:H,"Lead")', '=SUMIF(PIPELINE!H:H,"Lead",PIPELINE!F:F)'],
    ['Contatto', '=COUNTIF(PIPELINE!H:H,"Contatto")', '=SUMIF(PIPELINE!H:H,"Contatto",PIPELINE!F:F)'],
    ['Qualificato', '=COUNTIF(PIPELINE!H:H,"Qualificato")', '=SUMIF(PIPELINE!H:H,"Qualificato",PIPELINE!F:F)'],
    ['Proposta', '=COUNTIF(PIPELINE!H:H,"Proposta Inviata")', '=SUMIF(PIPELINE!H:H,"Proposta Inviata",PIPELINE!F:F)'],
    ['Negoziazione', '=COUNTIF(PIPELINE!H:H,"Negoziazione")', '=SUMIF(PIPELINE!H:H,"Negoziazione",PIPELINE!F:F)'],
    ['Contratto', '=COUNTIF(PIPELINE!H:H,"Contratto Inviato")', '=SUMIF(PIPELINE!H:H,"Contratto Inviato",PIPELINE!F:F)']
  ];
  sheet.getRange(6, 7, stageData.length, 3).setValues(stageData);
  sheet.getRange('I6:I11').setNumberFormat('#,##0€');

  // SEZIONE 4: ALERT E AZIONI
  sheet.getRange('A24').setValue('🚨 ALERT E AZIONI RICHIESTE').setFontSize(14).setFontWeight('bold').setFontColor('#CC0000');

  const alertData = [
    ['Follow-up Scaduti:', '=COUNTIFS("CHIAMATE & FOLLOW-UP"!M:M,"<"&TODAY(),"CHIAMATE & FOLLOW-UP"!N:N,"<>Completato")', 'prospect da richiamare'],
    ['Deal in Stallo (>14gg):', '=PIPELINE!B1009', 'deal fermi da troppo tempo'],
    ['Contratti da Firmare:', '=COUNTIF("GESTIONE CONTRATTI"!J:J,"Inviato")', 'contratti in attesa'],
    ['Contratti in Scadenza:', '="GESTIONE CONTRATTI"!B1009', 'da rinnovare nei prossimi 60 giorni']
  ];
  sheet.getRange(26, 1, alertData.length, 3).setValues(alertData);
  sheet.getRange('A26:A29').setFontWeight('bold');
  sheet.getRange('B26:B29').setFontWeight('bold').setFontColor('#CC0000');

  // SEZIONE 5: AZIONI RAPIDE
  sheet.getRange('G14').setValue('⚡ AZIONI RAPIDE').setFontSize(14).setFontWeight('bold');

  const azioniData = [
    ['📞 Registra Chiamata'],
    ['➕ Nuovo Prospect'],
    ['📄 Crea Contratto'],
    ['💰 Registra AUM'],
    ['📧 Invia Report']
  ];
  sheet.getRange(16, 7, azioniData.length, 1).setValues(azioniData);
  sheet.getRange('G16:G20').setFontWeight('bold').setBackground('#D9EAD3');

  // SEZIONE 6: PERFORMANCE MENSILE
  sheet.getRange('A33').setValue('📈 PERFORMANCE MESE CORRENTE').setFontSize(14).setFontWeight('bold');

  const perfData = [
    ['Nuovi Lead', '=COUNTIFS("DATABASE CONTATTI"!K:K,">="&EOMONTH(TODAY(),-1)+1)'],
    ['Clienti Acquisiti', '=COUNTIFS(PIPELINE!H:H,"Cliente Attivo",PIPELINE!R:R,">="&EOMONTH(TODAY(),-1)+1)'],
    ['AUM Acquisito', '=SUMIFS("REGISTRO AUM"!H:H,"REGISTRO AUM"!F:F,"Nuova Acquisizione","REGISTRO AUM"!B:B,">="&EOMONTH(TODAY(),-1)+1)'],
    ['CAC Medio', '=IF(B36>0,CONFIGURAZIONE!$B$25/12/B36,0)'],
    ['Fee Mensile Stimata', '=B37*CONFIGURAZIONE!$B$27']
  ];
  sheet.getRange(35, 1, perfData.length, 2).setValues(perfData);
  sheet.getRange('A35:A39').setFontWeight('bold');
  sheet.getRange('B37:B39').setNumberFormat('#,##0€');

  // Formattazione colonne
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidths(2, 5, 120);
  sheet.setColumnWidth(7, 180);
  sheet.setColumnWidths(8, 2, 120);

  // Proteggi il dashboard (solo visualizzazione)
  const protection = sheet.protect().setDescription('Dashboard Protetto');
  protection.setWarningOnly(true);
}

// ═══════════════════════════════════════════════════════════════════
// FUNZIONI DI POPOLAMENTO DATI ESEMPIO
// ═══════════════════════════════════════════════════════════════════

function popolaDatiEsempioCompleti(ss) {
  try {
    Logger.log('Popolamento Database Contatti...');
    popolaDatabaseContattiCompleto(ss);

    Logger.log('Popolamento Pipeline...');
    popolaPipelineCompleto(ss);

    Logger.log('Popolamento Chiamate...');
    popolaChiamateEsempio(ss);

    Logger.log('Popolamento Contratti...');
    popolaContrattiEsempio(ss);

    Logger.log('Popolamento AUM...');
    popolaAUMEsempio(ss);

    Logger.log('Popolamento Funnel...');
    popolaFunnelEsempio(ss);

    SpreadsheetApp.flush();
    Logger.log('Dati esempio popolati con successo');
  } catch (error) {
    Logger.log('Errore popolamento dati: ' + error);
    throw error;
  }
}

function popolaDatabaseContattiCompleto(ss) {
  const sheet = ss.getSheetByName('DATABASE CONTATTI');

  const nomi = ['Mario Rossi', 'Laura Bianchi', 'Giuseppe Verdi', 'Anna Ferrari', 'Marco Colombo',
                'Sofia Russo', 'Luca Esposito', 'Giulia Romano', 'Andrea Ricci', 'Francesca Bruno',
                'Paolo Galli', 'Chiara Conti', 'Davide Costa', 'Elena Giordano', 'Simone Mancini',
                'Valentina Rizzo', 'Federico Marino', 'Sara Greco', 'Matteo Fontana', 'Alessia Leone'];

  const aziende = ['Studio Commerciale', 'Legal Partners', 'Dental Care', 'Med Group', 'Consulting Pro',
                   'Finance Solutions', 'Tax Advisors', 'Business Center', 'Professional Services', 'Enterprise Hub'];

  const ruoli = ['CEO', 'CFO', 'Partner', 'Direttore', 'Titolare'];
  const categorie = ['Commercialista', 'Avvocato', 'Odontoiatra', 'Medico', 'Imprenditore', 'Consulente Lavoro'];
  const fonti = ['Cold Calling', 'LinkedIn', 'Referral', 'Newsletter', 'Partnership', 'Eventi Libro'];
  const tiers = ['A+ (VIP)', 'A (HOT)', 'B (WARM)', 'C (COLD)'];

  const data = [];
  const oggi = new Date();

  for (let i = 0; i < 50; i++) {
    const nome = nomi[Math.floor(Math.random() * nomi.length)];
    const azienda = aziende[Math.floor(Math.random() * aziende.length)] + ' ' + nome.split(' ')[1];
    const ruolo = ruoli[Math.floor(Math.random() * ruoli.length)];
    const categoria = categorie[Math.floor(Math.random() * categorie.length)];
    const fonte = fonti[Math.floor(Math.random() * fonti.length)];
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    const engagement = Math.floor(Math.random() * 10) + 1;
    const isCliente = Math.random() > 0.6;
    const aum = isCliente ? Math.floor(Math.random() * 300000) + 50000 : '';

    const dataPrimoContatto = new Date(oggi);
    dataPrimoContatto.setDate(oggi.getDate() - Math.floor(Math.random() * 365));

    const ultimoContatto = new Date(dataPrimoContatto);
    ultimoContatto.setDate(dataPrimoContatto.getDate() + Math.floor(Math.random() * 180));

    const email = nome.toLowerCase().replace(' ', '.') + '@example.com';
    const tel = '081' + Math.floor(Math.random() * 10000000);
    const linkedin = 'linkedin.com/in/' + nome.toLowerCase().replace(' ', '-');

    data.push([
      'C' + String(i + 1).padStart(4, '0'),
      nome,
      azienda,
      ruolo,
      email,
      tel,
      linkedin,
      categoria,
      fonte,
      tier,
      dataPrimoContatto,
      ultimoContatto,
      engagement,
      isCliente ? 'SÌ' : 'NO',
      aum,
      isCliente ? '' : 'P-' + String(i + 1).padStart(4, '0'),
      isCliente ? 'Cliente attivo e soddisfatto' : 'Da coltivare',
      fonte
    ]);
  }

  sheet.getRange(2, 1, data.length, 18).setValues(data);
}

function popolaPipelineCompleto(ss) {
  const sheet = ss.getSheetByName('PIPELINE');
  const dbSheet = ss.getSheetByName('DATABASE CONTATTI');

  const stages = ['Lead', 'Contatto', 'Qualificato', 'Proposta Inviata', 'Negoziazione', 'Contratto Inviato'];
  const fonti = ['Cold Calling', 'LinkedIn', 'Referral', 'Newsletter', 'Partnership'];
  const categorie = ['Commercialista', 'Avvocato', 'Odontoiatra', 'Imprenditore'];

  const data = [];
  const oggi = new Date();

  for (let i = 0; i < 20; i++) {
    const prospect = 'Prospect ' + (i + 1);
    const azienda = 'Azienda ' + (i + 1);
    const fonte = fonti[Math.floor(Math.random() * fonti.length)];
    const categoria = categorie[Math.floor(Math.random() * categorie.length)];
    const aumStimato = Math.floor(Math.random() * 250000) + 80000;

    const dataIngresso = new Date(oggi);
    dataIngresso.setDate(oggi.getDate() - Math.floor(Math.random() * 90));

    const stage = stages[Math.floor(Math.random() * stages.length)];
    const nextAction = 'Follow-up programmato';

    const dataNext = new Date(oggi);
    dataNext.setDate(oggi.getDate() + Math.floor(Math.random() * 14) + 1);

    const ultimaInterazione = new Date(oggi);
    ultimaInterazione.setDate(oggi.getDate() - Math.floor(Math.random() * 7));

    data.push([
      '', // Pipeline ID (auto-generated)
      prospect,
      azienda,
      fonte,
      categoria,
      aumStimato,
      dataIngresso,
      stage,
      '', // Probabilità (auto-generated)
      '', // Giorni in stage (auto-generated)
      nextAction,
      dataNext,
      ultimaInterazione,
      stage === 'Contratto Inviato' ? 'CTR-2025-' + String(i + 1).padStart(3, '0') : '',
      'Attivo',
      'Antonio Tritto',
      'Note per prospect ' + (i + 1),
      '',
      ''
    ]);
  }

  sheet.getRange(2, 1, data.length, 19).setValues(data);
}

function popolaChiamateEsempio(ss) {
  const sheet = ss.getSheetByName('CHIAMATE & FOLLOW-UP');
  const oggi = new Date();

  const esiti = ['Risposto - Interessato', 'Risposto - Non Interessato', 'Risposto - Richiamare', 'No Risposta', 'Appointment Fissato'];
  const qualita = ['Ottima', 'Buona', 'Media', 'Scarsa'];
  const interesse = ['Alto', 'Medio', 'Basso', 'Nullo'];

  const data = [];

  for (let i = 0; i < 30; i++) {
    const dataChiamata = new Date(oggi);
    dataChiamata.setDate(oggi.getDate() - Math.floor(Math.random() * 30));

    const ora = Math.floor(Math.random() * 8) + 9; // 9-17
    const minuti = Math.floor(Math.random() * 60);
    const oraStr = String(ora).padStart(2, '0') + ':' + String(minuti).padStart(2, '0');

    const contatto = 'Contatto ' + (i + 1);
    const tel = '081' + Math.floor(Math.random() * 10000000);
    const pipelineId = 'P-' + String(i + 1).padStart(4, '0');
    const tipo = 'Cold Call';
    const durata = Math.floor(Math.random() * 15) + 5;
    const esito = esiti[Math.floor(Math.random() * esiti.length)];
    const qual = qualita[Math.floor(Math.random() * qualita.length)];
    const inter = interesse[Math.floor(Math.random() * interesse.length)];
    const nextAction = esito.includes('Interessato') ? 'Inviare materiale informativo' : 'Follow-up tra 2 settimane';

    const dataFollowUp = new Date(dataChiamata);
    dataFollowUp.setDate(dataChiamata.getDate() + (esito.includes('Interessato') ? 3 : 14));

    const statoFollowUp = dataFollowUp > oggi ? 'Da Fare' : 'Completato';

    data.push([
      '', // Call ID (auto-generated)
      dataChiamata,
      oraStr,
      contatto,
      tel,
      pipelineId,
      tipo,
      durata,
      esito,
      qual,
      inter,
      nextAction,
      dataFollowUp,
      statoFollowUp,
      'Note chiamata ' + (i + 1),
      'Antonio Tritto'
    ]);
  }

  sheet.getRange(2, 1, data.length, 16).setValues(data);
}

function popolaContrattiEsempio(ss) {
  const sheet = ss.getSheetByName('GESTIONE CONTRATTI');
  const oggi = new Date();

  const tipiContratto = ['Gestione Patrimonio', 'Consulenza Finanziaria', 'Piano Pensionistico', 'TFR Aziendale'];
  const stati = ['Inviato', 'Approvato', 'Firmato', 'Attivo'];

  const data = [];

  for (let i = 0; i < 15; i++) {
    const cliente = 'Cliente ' + (i + 1);
    const tipo = tipiContratto[Math.floor(Math.random() * tipiContratto.length)];
    const aumContratto = Math.floor(Math.random() * 200000) + 80000;

    const dataCreazione = new Date(oggi);
    dataCreazione.setDate(oggi.getDate() - Math.floor(Math.random() * 60));

    const dataInvio = new Date(dataCreazione);
    dataInvio.setDate(dataCreazione.getDate() + Math.floor(Math.random() * 7));

    const stato = stati[Math.floor(Math.random() * stati.length)];
    let dataFirma = '';
    let dataAttivazione = '';

    if (stato === 'Firmato' || stato === 'Attivo') {
      dataFirma = new Date(dataInvio.getTime() + Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000);
      if (stato === 'Attivo') {
        dataAttivazione = new Date(dataFirma.getTime() + 3 * 24 * 60 * 60 * 1000);
      }
    }

    const feePerc = 0.005 + Math.random() * 0.005; // 0.5% - 1%
    const durata = 3; // anni
    const rinnovoAuto = Math.random() > 0.5 ? 'SÌ' : 'NO';

    data.push([
      '', // Contratto ID (auto-generated)
      'P-' + String(i + 1).padStart(4, '0'),
      cliente,
      tipo,
      aumContratto,
      dataCreazione,
      dataInvio,
      dataFirma,
      dataAttivazione,
      stato,
      feePerc,
      '', // Fee Annua (auto-generated)
      durata,
      '', // Data Scadenza (auto-generated)
      rinnovoAuto,
      'https://drive.google.com/contratto-' + (i + 1),
      'SÌ',
      cliente,
      'Note contratto ' + (i + 1)
    ]);
  }

  sheet.getRange(2, 1, data.length, 19).setValues(data);
}

function popolaAUMEsempio(ss) {
  const sheet = ss.getSheetByName('REGISTRO AUM');
  const oggi = new Date();

  const tipiOp = ['Nuova Acquisizione', 'Versamento Aggiuntivo', 'Performance Positiva', 'Performance Negativa', 'Prelievo Parziale'];

  const data = [];

  for (let i = 0; i < 40; i++) {
    const dataReg = new Date(oggi);
    dataReg.setDate(oggi.getDate() - Math.floor(Math.random() * 180));

    const cliente = 'Cliente ' + (Math.floor(i / 2) + 1);
    const pipelineId = i < 20 ? 'P-' + String(i + 1).padStart(4, '0') : '';
    const contrattoId = 'CTR-2025-' + String(Math.floor(i / 2) + 1).padStart(3, '0');
    const tipoOp = tipiOp[Math.floor(Math.random() * tipiOp.length)];

    let aumPrec = Math.floor(Math.random() * 200000) + 50000;
    let variazione = 0;
    let performance = 0;
    let versamento = 0;

    switch(tipoOp) {
      case 'Nuova Acquisizione':
        aumPrec = 0;
        variazione = Math.floor(Math.random() * 200000) + 80000;
        versamento = variazione;
        break;
      case 'Versamento Aggiuntivo':
        variazione = Math.floor(Math.random() * 50000) + 10000;
        versamento = variazione;
        break;
      case 'Performance Positiva':
        performance = 0.02 + Math.random() * 0.08; // 2%-10%
        variazione = Math.floor(aumPrec * performance);
        break;
      case 'Performance Negativa':
        performance = -(0.01 + Math.random() * 0.05); // -1% a -6%
        variazione = Math.floor(aumPrec * performance);
        break;
      case 'Prelievo Parziale':
        variazione = -Math.floor(Math.random() * 30000) - 5000;
        versamento = variazione;
        break;
    }

    const causale = 'Operazione ' + tipoOp;

    data.push([
      '', // Record ID (auto-generated)
      dataReg,
      cliente,
      pipelineId,
      contrattoId,
      tipoOp,
      aumPrec,
      variazione,
      '', // AUM Nuovo (auto-generated)
      causale,
      performance || '',
      versamento || '',
      'Note operazione ' + (i + 1),
      'Antonio Tritto'
    ]);
  }

  sheet.getRange(2, 1, data.length, 14).setValues(data);
}

function popolaFunnelEsempio(ss) {
  const sheet = ss.getSheetByName('FUNNEL GENERALE');
  const oggi = new Date();

  const data = [];

  // Popola 8 settimane di dati
  for (let i = 7; i >= 0; i--) {
    const dataInizio = new Date(oggi);
    dataInizio.setDate(oggi.getDate() - (i * 7) - oggi.getDay() + 1);

    const dataFine = new Date(dataInizio);
    dataFine.setDate(dataInizio.getDate() + 6);

    const leadNuovi = Math.floor(Math.random() * 30) + 20;
    const chiamate = Math.floor(Math.random() * 50) + 80;
    const email = Math.floor(Math.random() * 200) + 300;
    const meetingFissati = Math.floor(leadNuovi * 0.3);
    const meetingFatti = Math.floor(meetingFissati * 0.75);
    const prospectQualificati = Math.floor(meetingFatti * 0.6);
    const proposteInviate = Math.floor(prospectQualificati * 0.8);
    const clientiChiusi = Math.floor(proposteInviate * 0.25);
    const aumWeek = clientiChiusi * (Math.floor(Math.random() * 80000) + 100000);
    const spesaMarketing = Math.floor(Math.random() * 500) + 200;

    data.push([
      8 - i,
      dataInizio,
      dataFine,
      leadNuovi,
      chiamate,
      email,
      meetingFissati,
      meetingFatti,
      '', // No-Show (auto-generated)
      prospectQualificati,
      proposteInviate,
      clientiChiusi,
      aumWeek,
      '', // AUM Cumulativo (auto-generated)
      spesaMarketing,
      '', // CAC (auto-generated)
      '' // ROI (auto-generated)
    ]);
  }

  sheet.getRange(2, 1, data.length, 17).setValues(data);
}
