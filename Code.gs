/**
 * ═══════════════════════════════════════════════════════════════════
 * ECOSISTEMA ACQUISIZIONE CLIENTI - SISTEMA COMPLETO AUTOMATIZZATO
 * ═══════════════════════════════════════════════════════════════════
 * by Antonio Tritto - Private Banking System
 *
 * FUNZIONALITÀ COMPLETE:
 * ✅ Gestione Clienti e Prospect con tracking completo
 * ✅ Sistema Contratti con workflow automatico
 * ✅ Automazione Chiamate con reminder e follow-up
 * ✅ Pipeline Visuale con grafici in tempo reale
 * ✅ Registrazione AUM automatica
 * ✅ Email automation trigger-based
 * ✅ Dashboard interattivo con drill-down
 * ✅ Alert automatici e notifiche
 * ✅ Report mensili automatici
 */

// ═══════════════════════════════════════════════════════════════════
// CONFIGURAZIONE GLOBALE
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
  EMAIL_NOTIFICHE: 'antonio@antoniotritto.com', // Modifica con la tua email
  GIORNI_ALERT_FOLLOW_UP: 3,
  GIORNI_ALERT_CONTRATTO: 7,
  SOGLIA_PIPELINE_STALLO: 14,
  AUM_MINIMO_TARGET: 50000,
  CONVERSIONE_TARGET_LEAD_APP: 0.15,
  CONVERSIONE_TARGET_APP_CLIENTE: 0.20
};

// ═══════════════════════════════════════════════════════════════════
// MENU PRINCIPALE
// ═══════════════════════════════════════════════════════════════════

function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('🎯 CRM Antonio Tritto')
    .addItem('🚀 Setup Iniziale Completo', 'setupCompletoSistema')
    .addSeparator()
    .addSubMenu(ui.createMenu('📞 Gestione Chiamate')
      .addItem('➕ Registra Nuova Chiamata', 'registraNuovaChiamata')
      .addItem('📋 Vedi Chiamate da Fare Oggi', 'mostraChiamateDaFareOggi')
      .addItem('🔔 Imposta Reminder Chiamata', 'impostaReminderChiamata'))
    .addSubMenu(ui.createMenu('💼 Gestione Pipeline')
      .addItem('👁️ Visualizza Pipeline Grafica', 'visualizzaPipelineGrafica')
      .addItem('⬆️ Avanza Prospect di Stage', 'avanzaProspectStage')
      .addItem('❌ Chiudi Deal (Vinto/Perso)', 'chiudiDeal')
      .addItem('🔍 Trova Prospect in Stallo', 'trovaDealInStallo'))
    .addSubMenu(ui.createMenu('📄 Gestione Contratti')
      .addItem('➕ Crea Nuovo Contratto', 'creaNuovoContratto')
      .addItem('📨 Invia Contratto per Email', 'inviaContratto')
      .addItem('✅ Registra Firma Contratto', 'registraFirmaContratto')
      .addItem('📊 Report Contratti Pendenti', 'reportContrattiPendenti'))
    .addSubMenu(ui.createMenu('💰 Gestione AUM')
      .addItem('➕ Registra Nuovo AUM', 'registraNuovoAUM')
      .addItem('📈 Aggiorna AUM Cliente', 'aggiornaAUMCliente')
      .addItem('📊 Report AUM Mensile', 'generaReportAUMMensile'))
    .addSeparator()
    .addSubMenu(ui.createMenu('🤖 Automazioni')
      .addItem('⚙️ Attiva Tutti i Trigger', 'attivaAutomazioni')
      .addItem('🛑 Disattiva Tutti i Trigger', 'disattivaAutomazioni')
      .addItem('📧 Invia Report Settimanale', 'inviaReportSettimanale'))
    .addSeparator()
    .addItem('📊 Aggiorna Dashboard', 'aggiornaDashboardCompleto')
    .addItem('🔄 Rigenera Dati Esempio', 'rigeneraDatiEsempio')
    .addItem('ℹ️ Guida Completa', 'mostraGuidaCompleta')
    .addToUi();
}

// ═══════════════════════════════════════════════════════════════════
// SETUP INIZIALE COMPLETO
// ═══════════════════════════════════════════════════════════════════

function setupCompletoSistema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  // Conferma prima di procedere
  const result = ui.alert(
    '🚀 SETUP SISTEMA COMPLETO',
    'Questo creerà tutti gli sheet e le strutture necessarie.\n\n' +
    '⚠️ ATTENZIONE: Se esistono già sheet con lo stesso nome, verranno sostituiti.\n\n' +
    'Continuare?',
    ui.ButtonSet.YES_NO
  );

  if (result !== ui.Button.YES) return;

  try {
    ui.alert('⏳ Setup in corso... Attendere prego (30-60 secondi)');

    // STEP 1: Crea tutti gli sheet
    Logger.log('STEP 1: Creazione sheet...');
    createAllSheets(ss);

    // STEP 2: Setup Configurazione
    Logger.log('STEP 2: Setup Configurazione...');
    setupConfigurazione(ss);

    // STEP 3: Setup Database Contatti
    Logger.log('STEP 3: Setup Database Contatti...');
    setupDatabaseContatti(ss);

    // STEP 4: Setup Pipeline
    Logger.log('STEP 4: Setup Pipeline...');
    setupPipeline(ss);

    // STEP 5: Setup Gestione Contratti
    Logger.log('STEP 5: Setup Gestione Contratti...');
    setupGestioneContratti(ss);

    // STEP 6: Setup Registro AUM
    Logger.log('STEP 6: Setup Registro AUM...');
    setupRegistroAUM(ss);

    // STEP 7: Setup Chiamate e Follow-up
    Logger.log('STEP 7: Setup Chiamate...');
    setupChiamateFollowUp(ss);

    // STEP 8: Setup Interazioni Timeline
    Logger.log('STEP 8: Setup Timeline Interazioni...');
    setupTimelineInterazioni(ss);

    // STEP 9: Setup Analytics
    Logger.log('STEP 9: Setup Analytics...');
    setupAnalytics(ss);

    // STEP 10: Setup Funnel Generale
    Logger.log('STEP 10: Setup Funnel Generale...');
    setupFunnelGenerale(ss);

    // STEP 11: Setup altri sheet (Newsletter, etc.)
    Logger.log('STEP 11: Setup canali acquisizione...');
    setupCanaliAcquisizione(ss);

    // STEP 12: Setup Dashboard (ULTIMO - dipende da tutti gli altri)
    Logger.log('STEP 12: Setup Dashboard...');
    setupDashboardCompleto(ss);

    // STEP 13: Popola dati di esempio
    Logger.log('STEP 13: Popolamento dati esempio...');
    popolaDatiEsempioCompleti(ss);

    // STEP 14: Crea grafici
    Logger.log('STEP 14: Creazione grafici...');
    creaGraficiPipeline(ss);

    SpreadsheetApp.flush();

    ui.alert(
      '✅ SETUP COMPLETATO CON SUCCESSO!\n\n' +
      '📊 Sistema completo creato:\n' +
      '   • 15+ sheet interconnessi\n' +
      '   • Dashboard interattivo\n' +
      '   • Pipeline visuale con grafici\n' +
      '   • 50+ contatti esempio\n' +
      '   • 20+ prospect in pipeline\n' +
      '   • Sistema automazioni pronto\n\n' +
      '🎯 VAI SU → DASHBOARD per iniziare!\n\n' +
      '💡 Consiglio: Attiva le automazioni dal menu:\n' +
      '   CRM → Automazioni → Attiva Tutti i Trigger'
    );

  } catch (error) {
    Logger.log('ERRORE SETUP: ' + error);
    ui.alert('❌ ERRORE durante il setup:\n\n' + error + '\n\nContatta il supporto.');
  }
}

// ═══════════════════════════════════════════════════════════════════
// CREAZIONE SHEET
// ═══════════════════════════════════════════════════════════════════

function createAllSheets(ss) {
  const sheets = [
    {name: 'DASHBOARD', color: '#1155CC', index: 0},
    {name: 'PIPELINE', color: '#38761D', index: 1},
    {name: 'DATABASE CONTATTI', color: '#666666', index: 2},
    {name: 'GESTIONE CONTRATTI', color: '#990000', index: 3},
    {name: 'REGISTRO AUM', color: '#FF6D01', index: 4},
    {name: 'CHIAMATE & FOLLOW-UP', color: '#FF9900', index: 5},
    {name: 'TIMELINE INTERAZIONI', color: '#0B5394', index: 6},
    {name: 'ANALYTICS', color: '#134F5C', index: 7},
    {name: 'FUNNEL GENERALE', color: '#00FF00', index: 8},
    {name: 'NEWSLETTER', color: '#FFFF00', index: 9},
    {name: 'COLD CALLING', color: '#FF9900', index: 10},
    {name: 'PARTNERSHIP', color: '#9900FF', index: 11},
    {name: 'TFR ENTRY', color: '#FF0000', index: 12},
    {name: 'EVENTI LIBRO', color: '#A64D79', index: 13},
    {name: 'PERCORSI FORMATIVI', color: '#00FFFF', index: 14},
    {name: 'CONFIGURAZIONE', color: '#000000', index: 15}
  ];

  // Ottieni tutti gli sheet esistenti
  const existingSheets = ss.getSheets();
  const existingNames = existingSheets.map(s => s.getName());

  // Crea o ottieni ogni sheet
  sheets.forEach(sheetConfig => {
    let sheet;
    if (existingNames.includes(sheetConfig.name)) {
      sheet = ss.getSheetByName(sheetConfig.name);
      sheet.clear(); // Pulisci se esiste già
    } else {
      sheet = ss.insertSheet(sheetConfig.name);
    }
    sheet.setTabColor(sheetConfig.color);
  });

  // Riordina gli sheet
  sheets.forEach((sheetConfig, index) => {
    const sheet = ss.getSheetByName(sheetConfig.name);
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(index + 1);
  });
}

// ═══════════════════════════════════════════════════════════════════
// SETUP CONFIGURAZIONE
// ═══════════════════════════════════════════════════════════════════

function setupConfigurazione(ss) {
  const sheet = ss.getSheetByName('CONFIGURAZIONE');
  sheet.clear();

  // Titolo
  sheet.getRange('A1').setValue('⚙️ CONFIGURAZIONE SISTEMA CRM').setFontSize(14).setFontWeight('bold');

  // SEZIONE A: Liste Dropdown
  sheet.getRange('A3').setValue('═══ LISTE VALORI ═══').setFontWeight('bold').setFontSize(12);

  const categorieData = [
    ['CATEGORIA'],
    ['Imprenditore'],
    ['Commercialista'],
    ['Avvocato'],
    ['Odontoiatra'],
    ['Consulente Lavoro'],
    ['Medico'],
    ['Architetto'],
    ['PMI'],
    ['Altro']
  ];
  sheet.getRange(5, 1, categorieData.length, 1).setValues(categorieData);

  const stageData = [
    ['STAGE'],
    ['Lead'],
    ['Contatto'],
    ['Qualificato'],
    ['Proposta Inviata'],
    ['Negoziazione'],
    ['Contratto Inviato'],
    ['Contratto Firmato'],
    ['Cliente Attivo'],
    ['Chiuso Perso']
  ];
  sheet.getRange(5, 2, stageData.length, 1).setValues(stageData);

  const tierData = [
    ['TIER'],
    ['A+ (VIP)'],
    ['A (HOT)'],
    ['B (WARM)'],
    ['C (COLD)']
  ];
  sheet.getRange(5, 3, tierData.length, 1).setValues(tierData);

  const fonteData = [
    ['FONTE'],
    ['Newsletter'],
    ['Cold Calling'],
    ['Partnership'],
    ['TFR Entry'],
    ['Eventi Libro'],
    ['Percorsi Formativi'],
    ['Referral'],
    ['LinkedIn'],
    ['Fiera Dental'],
    ['Ex Banca'],
    ['Sito Web'],
    ['Facebook'],
    ['Instagram'],
    ['Altro']
  ];
  sheet.getRange(5, 4, fonteData.length, 1).setValues(fonteData);

  const tipoContrattoData = [
    ['TIPO CONTRATTO'],
    ['Gestione Patrimonio'],
    ['Consulenza Finanziaria'],
    ['TFR Aziendale'],
    ['Piano Pensionistico'],
    ['Polizza Vita'],
    ['Investimenti'],
    ['Altro']
  ];
  sheet.getRange(5, 5, tipoContrattoData.length, 1).setValues(tipoContrattoData);

  const statoContrattoData = [
    ['STATO CONTRATTO'],
    ['Bozza'],
    ['Inviato'],
    ['In Revisione'],
    ['Approvato'],
    ['Firmato'],
    ['Attivo'],
    ['Scaduto'],
    ['Annullato']
  ];
  sheet.getRange(5, 6, statoContrattoData.length, 1).setValues(statoContrattoData);

  // Formattazione headers
  sheet.getRange('A5:F5').setFontWeight('bold').setBackground('#CCCCCC');

  // SEZIONE B: Target e KPI
  sheet.getRange('A20').setValue('═══ TARGET ANNUALI ═══').setFontWeight('bold').setFontSize(12);

  const targetData = [
    ['AUM Target Anno', 15000000],
    ['Clienti Target Anno', 150],
    ['AUM Medio Target', 100000],
    ['Budget Marketing Annuale', 10000],
    ['CAC Target (€)', 67],
    ['Fee % Media Gestione', 0.005],
    ['Ricavo Annuo Target', '=B22*B27']
  ];
  sheet.getRange(22, 1, targetData.length, 2).setValues(targetData);

  // SEZIONE C: Parametri Automazioni
  sheet.getRange('A32').setValue('═══ PARAMETRI AUTOMAZIONI ═══').setFontWeight('bold').setFontSize(12);

  const automazioniData = [
    ['Email Notifiche', CONFIG.EMAIL_NOTIFICHE],
    ['Giorni Alert Follow-up', CONFIG.GIORNI_ALERT_FOLLOW_UP],
    ['Giorni Alert Contratto', CONFIG.GIORNI_ALERT_CONTRATTO],
    ['Giorni Stallo Pipeline', CONFIG.SOGLIA_PIPELINE_STALLO],
    ['AUM Minimo Target (€)', CONFIG.AUM_MINIMO_TARGET],
    ['Conv. Target Lead→App', CONFIG.CONVERSIONE_TARGET_LEAD_APP],
    ['Conv. Target App→Cliente', CONFIG.CONVERSIONE_TARGET_APP_CLIENTE]
  ];
  sheet.getRange(34, 1, automazioniData.length, 2).setValues(automazioniData);

  // Formattazione
  sheet.getRange('A22:A28').setFontWeight('bold');
  sheet.getRange('A34:A40').setFontWeight('bold');
  sheet.getRange('B22:B26').setNumberFormat('#,##0');
  sheet.getRange('B27').setNumberFormat('0.00%');
  sheet.getRange('B28').setNumberFormat('#,##0€');
  sheet.getRange('B35:B38').setNumberFormat('#,##0');
  sheet.getRange('B39:B40').setNumberFormat('0.0%');

  // Protezione parziale
  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 200);
}

// ═══════════════════════════════════════════════════════════════════
// SETUP DATABASE CONTATTI
// ═══════════════════════════════════════════════════════════════════

function setupDatabaseContatti(ss) {
  const sheet = ss.getSheetByName('DATABASE CONTATTI');
  sheet.clear();

  const headers = [
    'ID', 'Nome Completo', 'Azienda', 'Ruolo', 'Email', 'Tel', 'LinkedIn',
    'Categoria', 'Fonte', 'Tier', 'Data Primo Contatto', 'Ultimo Contatto',
    'Engagement Score', 'Cliente?', 'AUM Attuale', 'Pipeline ID', 'Note', 'Tags'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#434343');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 40);
  sheet.setFrozenRows(1);

  const configSheet = ss.getSheetByName('CONFIGURAZIONE');

  // Data Validation
  sheet.getRange('H2:H10000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(configSheet.getRange('A6:A14'))
      .build()
  );

  sheet.getRange('I2:I10000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(configSheet.getRange('D6:D19'))
      .build()
  );

  sheet.getRange('J2:J10000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(configSheet.getRange('C6:C9'))
      .build()
  );

  sheet.getRange('N2:N10000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['SÌ', 'NO'])
      .build()
  );

  // Formattazione colonne
  sheet.setColumnWidth(1, 60);
  sheet.setColumnWidth(2, 180);
  sheet.setColumnWidth(3, 180);
  sheet.setColumnWidth(4, 140);
  sheet.setColumnWidth(5, 220);
  sheet.setColumnWidth(6, 120);
  sheet.setColumnWidth(7, 280);
  sheet.setColumnWidths(8, 3, 120);
  sheet.setColumnWidths(11, 2, 110);
  sheet.setColumnWidth(13, 80);
  sheet.setColumnWidth(14, 80);
  sheet.setColumnWidth(15, 120);
  sheet.setColumnWidth(16, 100);
  sheet.setColumnWidth(17, 300);
  sheet.setColumnWidth(18, 200);

  sheet.getRange('O2:O10000').setNumberFormat('#,##0€');

  // Formattazione condizionale per Tier
  const tierRange = sheet.getRange('J2:J10000');
  const tierRules = [
    {value: 'A+ (VIP)', color: '#FF0000', fontColor: '#FFFFFF'},
    {value: 'A (HOT)', color: '#FF6D01', fontColor: '#FFFFFF'},
    {value: 'B (WARM)', color: '#FFD966'},
    {value: 'C (COLD)', color: '#D9EAD3'}
  ];

  const conditionalRules = tierRules.map(rule =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(rule.value)
      .setBackground(rule.color)
      .setFontColor(rule.fontColor || '#000000')
      .setRanges([tierRange])
      .build()
  );

  sheet.setConditionalFormatRules(conditionalRules);
}

// ═══════════════════════════════════════════════════════════════════
// SETUP PIPELINE
// ═══════════════════════════════════════════════════════════════════

function setupPipeline(ss) {
  const sheet = ss.getSheetByName('PIPELINE');
  sheet.clear();

  const headers = [
    'Pipeline ID', 'Prospect', 'Azienda', 'Fonte', 'Categoria', 'AUM Stimato',
    'Data Ingresso', 'Stage Attuale', 'Probabilità %', 'Giorni in Stage',
    'Next Action', 'Data Next Action', 'Ultima Interazione', 'Contratto ID',
    'Stato', 'Owner', 'Note', 'Data Chiusura', 'Motivo Perso'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#38761D');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 40);
  sheet.setFrozenRows(1);

  const configSheet = ss.getSheetByName('CONFIGURAZIONE');

  // Data Validation
  sheet.getRange('D2:D1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(configSheet.getRange('D6:D19'))
      .build()
  );

  sheet.getRange('E2:E1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(configSheet.getRange('A6:A14'))
      .build()
  );

  sheet.getRange('H2:H1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(configSheet.getRange('B6:B14'))
      .build()
  );

  // Formula Pipeline ID automatico
  sheet.getRange('A2').setFormula('="P-"&TEXT(ROW()-1,"0000")');

  // Formula Probabilità basata su Stage
  sheet.getRange('I2').setFormula(
    '=IFS(' +
    'H2="Lead",5%,' +
    'H2="Contatto",10%,' +
    'H2="Qualificato",30%,' +
    'H2="Proposta Inviata",50%,' +
    'H2="Negoziazione",70%,' +
    'H2="Contratto Inviato",85%,' +
    'H2="Contratto Firmato",95%,' +
    'H2="Cliente Attivo",100%,' +
    'H2="Chiuso Perso",0%,' +
    'TRUE,0%)'
  );

  // Formula Giorni in Stage
  sheet.getRange('J2').setFormula('=IF(G2<>"",TODAY()-G2,"")');

  // Copia formule in giù
  sheet.getRange('A2:A1000').setFormula(sheet.getRange('A2').getFormula());
  sheet.getRange('I2:I1000').setFormula(sheet.getRange('I2').getFormula());
  sheet.getRange('J2:J1000').setFormula(sheet.getRange('J2').getFormula());

  // Formattazione
  sheet.getRange('F2:F1000').setNumberFormat('#,##0€');
  sheet.getRange('I2:I1000').setNumberFormat('0%');

  // Formattazione condizionale per Stage
  const stageRange = sheet.getRange('H2:H1000');
  const stageRules = [
    {value: 'Lead', color: '#F3F3F3'},
    {value: 'Contatto', color: '#FFF2CC'},
    {value: 'Qualificato', color: '#FCE5CD'},
    {value: 'Proposta Inviata', color: '#D9EAD3'},
    {value: 'Negoziazione', color: '#B6D7A8'},
    {value: 'Contratto Inviato', color: '#93C47D'},
    {value: 'Contratto Firmato', color: '#6AA84F', fontColor: '#FFFFFF'},
    {value: 'Cliente Attivo', color: '#38761D', fontColor: '#FFFFFF'},
    {value: 'Chiuso Perso', color: '#F4CCCC'}
  ];

  const stageConditionalRules = stageRules.map(rule =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(rule.value)
      .setBackground(rule.color)
      .setFontColor(rule.fontColor || '#000000')
      .setRanges([stageRange])
      .build()
  );

  sheet.setConditionalFormatRules(stageConditionalRules);

  // Alert per deal in stallo (giorni in stage > soglia)
  const stalloRange = sheet.getRange('J2:J1000');
  const stalloRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(CONFIG.SOGLIA_PIPELINE_STALLO)
    .setBackground('#EA4335')
    .setFontColor('#FFFFFF')
    .setBold(true)
    .setRanges([stalloRange])
    .build();

  sheet.setConditionalFormatRules([...stageConditionalRules, stalloRule]);

  // Larghezza colonne
  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 180);
  sheet.setColumnWidth(3, 180);
  sheet.setColumnWidths(4, 2, 130);
  sheet.setColumnWidth(6, 120);
  sheet.setColumnWidths(7, 2, 110);
  sheet.setColumnWidth(9, 90);
  sheet.setColumnWidth(10, 100);
  sheet.setColumnWidth(11, 200);
  sheet.setColumnWidths(12, 2, 110);
  sheet.setColumnWidth(14, 100);
  sheet.setColumnWidth(15, 80);
  sheet.setColumnWidth(16, 120);
  sheet.setColumnWidth(17, 300);
  sheet.setColumnWidth(18, 110);
  sheet.setColumnWidth(19, 200);

  // Mini Dashboard in basso
  sheet.getRange('A1003').setValue('═══ PIPELINE SUMMARY ═══').setFontWeight('bold').setFontSize(12);

  const summaryHeaders = ['METRICA', 'VALORE', 'TARGET', 'STATUS'];
  sheet.getRange(1005, 1, 1, 4).setValues([summaryHeaders]);
  sheet.getRange('A1005:D1005').setFontWeight('bold').setBackground('#CCCCCC');

  const summaryData = [
    ['Tot Pipeline Value', '=SUMIF(H2:H1000,"<>Cliente Attivo",F2:F1000)', 15000000, '=IF(B1006>=C1006,"✅","⚠️")'],
    ['Numero Deal Attivi', '=COUNTIF(H2:H1000,"<>Cliente Attivo")-COUNTIF(H2:H1000,"Chiuso Perso")', 50, '=IF(B1007>=C1007,"✅","⚠️")'],
    ['Deal in Negoziazione', '=COUNTIF(H2:H1000,"Negoziazione")', 10, '=IF(B1008<=C1008,"✅","⚠️")'],
    ['Deal in Stallo (>' + CONFIG.SOGLIA_PIPELINE_STALLO + 'gg)', '=COUNTIFS(J2:J1000,">"&' + CONFIG.SOGLIA_PIPELINE_STALLO + ',H2:H1000,"<>Cliente Attivo",H2:H1000,"<>Chiuso Perso")', 5, '=IF(B1009<=C1009,"✅","❌")'],
    ['Contratti da Firmare', '=COUNTIF(H2:H1000,"Contratto Inviato")', 8, '=IF(B1010>=C1010,"✅","⚠️")'],
    ['Tasso Conversione', '=IFERROR(COUNTIF(H2:H1000,"Cliente Attivo")/COUNTA(A2:A1000),0)', CONFIG.CONVERSIONE_TARGET_APP_CLIENTE, '=IF(B1011>=C1011,"✅","⚠️")']
  ];
  sheet.getRange(1006, 1, summaryData.length, 4).setValues(summaryData);

  sheet.getRange('B1006:B1010').setNumberFormat('#,##0');
  sheet.getRange('B1011').setNumberFormat('0.0%');
  sheet.getRange('C1006:C1010').setNumberFormat('#,##0');
  sheet.getRange('C1011').setNumberFormat('0.0%');
}

// ═══════════════════════════════════════════════════════════════════
// SETUP GESTIONE CONTRATTI
// ═══════════════════════════════════════════════════════════════════

function setupGestioneContratti(ss) {
  const sheet = ss.getSheetByName('GESTIONE CONTRATTI');
  sheet.clear();

  const headers = [
    'Contratto ID', 'Pipeline ID', 'Cliente', 'Tipo Contratto', 'AUM Contratto',
    'Data Creazione', 'Data Invio', 'Data Firma', 'Data Attivazione', 'Stato',
    'Fee %', 'Fee Annua (€)', 'Durata (anni)', 'Data Scadenza', 'Rinnovo Auto?',
    'Link Documento', 'Email Inviata?', 'Firmato Da', 'Note'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#990000');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  sheet.setRowHeight(1, 40);
  sheet.setFrozenRows(1);

  const configSheet = ss.getSheetByName('CONFIGURAZIONE');

  // Formula Contratto ID automatico
  sheet.getRange('A2').setFormula('="CTR-"&TEXT(YEAR(TODAY()),"0000")&"-"&TEXT(ROW()-1,"000")');
  sheet.getRange('A2').copyTo(sheet.getRange('A2:A1000'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);

  // Data Validation
  sheet.getRange('D2:D1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(configSheet.getRange('E6:E12'))
      .build()
  );

  sheet.getRange('J2:J1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(configSheet.getRange('F6:F13'))
      .build()
  );

  sheet.getRange('O2:O1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['SÌ', 'NO'])
      .build()
  );

  sheet.getRange('Q2:Q1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['SÌ', 'NO'])
      .build()
  );

  // Formula Fee Annua
  sheet.getRange('L2').setFormula('=IF(AND(E2<>"",K2<>""),E2*K2,"")');
  sheet.getRange('L2').copyTo(sheet.getRange('L2:L1000'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);

  // Formula Data Scadenza
  sheet.getRange('N2').setFormula('=IF(AND(I2<>"",M2<>""),DATE(YEAR(I2)+M2,MONTH(I2),DAY(I2)),"")');
  sheet.getRange('N2').copyTo(sheet.getRange('N2:N1000'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);

  // Formattazione
  sheet.getRange('E2:E1000').setNumberFormat('#,##0€');
  sheet.getRange('K2:K1000').setNumberFormat('0.00%');
  sheet.getRange('L2:L1000').setNumberFormat('#,##0€');

  // Formattazione condizionale Stato
  const statoRange = sheet.getRange('J2:J1000');
  const statoRules = [
    {value: 'Bozza', color: '#F3F3F3'},
    {value: 'Inviato', color: '#FFF2CC'},
    {value: 'In Revisione', color: '#FCE5CD'},
    {value: 'Approvato', color: '#D9EAD3'},
    {value: 'Firmato', color: '#93C47D'},
    {value: 'Attivo', color: '#38761D', fontColor: '#FFFFFF'},
    {value: 'Scaduto', color: '#E06666', fontColor: '#FFFFFF'},
    {value: 'Annullato', color: '#CCCCCC'}
  ];

  const conditionalRules = statoRules.map(rule =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(rule.value)
      .setBackground(rule.color)
      .setFontColor(rule.fontColor || '#000000')
      .setRanges([statoRange])
      .build()
  );

  sheet.setConditionalFormatRules(conditionalRules);

  // Alert contratti in scadenza
  const scadenzaRange = sheet.getRange('N2:N1000');
  const scadenzaRule = SpreadsheetApp.newConditionalFormatRule()
    .whenDateBefore(SpreadsheetApp.RelativeDate.TODAY_AFTER_60_DAYS)
    .setBackground('#F4CCCC')
    .setBold(true)
    .setRanges([scadenzaRange])
    .build();

  sheet.setConditionalFormatRules([...conditionalRules, scadenzaRule]);

  // Larghezza colonne
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 180);
  sheet.setColumnWidth(4, 180);
  sheet.setColumnWidth(5, 120);
  sheet.setColumnWidths(6, 4, 110);
  sheet.setColumnWidth(10, 120);
  sheet.setColumnWidths(11, 2, 100);
  sheet.setColumnWidths(13, 2, 110);
  sheet.setColumnWidth(15, 80);
  sheet.setColumnWidth(16, 250);
  sheet.setColumnWidth(17, 80);
  sheet.setColumnWidth(18, 180);
  sheet.setColumnWidth(19, 300);

  // Summary contratti
  sheet.getRange('A1003').setValue('═══ CONTRATTI SUMMARY ═══').setFontWeight('bold').setFontSize(12);

  const summaryData = [
    ['Contratti Attivi', '=COUNTIF(J2:J1000,"Attivo")'],
    ['Contratti in Attesa Firma', '=COUNTIF(J2:J1000,"Inviato")'],
    ['AUM Totale Contrattualizzato', '=SUMIF(J2:J1000,"Attivo",E2:E1000)'],
    ['Fee Annua Totale', '=SUMIF(J2:J1000,"Attivo",L2:L1000)'],
    ['Contratti in Scadenza (60gg)', '=COUNTIFS(N2:N1000,"<="&TODAY()+60,J2:J1000,"Attivo")']
  ];
  sheet.getRange(1005, 1, summaryData.length, 2).setValues(summaryData);
  sheet.getRange('A1005:A1009').setFontWeight('bold');
  sheet.getRange('B1007:B1008').setNumberFormat('#,##0€');
}

// ═══════════════════════════════════════════════════════════════════
// SETUP REGISTRO AUM
// ═══════════════════════════════════════════════════════════════════

function setupRegistroAUM(ss) {
  const sheet = ss.getSheetByName('REGISTRO AUM');
  sheet.clear();

  const headers = [
    'Record ID', 'Data Registrazione', 'Cliente', 'Pipeline ID', 'Contratto ID',
    'Tipo Operazione', 'AUM Precedente', 'Variazione AUM', 'AUM Nuovo',
    'Causale', 'Performance %', 'Versamento/Prelievo', 'Note', 'Registrato Da'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#FF6D01');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  sheet.setRowHeight(1, 40);
  sheet.setFrozenRows(1);

  // Formula Record ID
  sheet.getRange('A2').setFormula('="AUM-"&TEXT(ROW()-1,"00000")');
  sheet.getRange('A2').copyTo(sheet.getRange('A2:A10000'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);

  // Data Validation Tipo Operazione
  sheet.getRange('F2:F10000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList([
        'Nuova Acquisizione',
        'Versamento Aggiuntivo',
        'Prelievo Parziale',
        'Prelievo Totale',
        'Performance Positiva',
        'Performance Negativa',
        'Aggiustamento',
        'Chiusura Account'
      ])
      .build()
  );

  // Formula AUM Nuovo
  sheet.getRange('I2').setFormula('=IF(G2<>"",G2+H2,"")');
  sheet.getRange('I2').copyTo(sheet.getRange('I2:I10000'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);

  // Formattazione
  sheet.getRange('G2:I10000').setNumberFormat('#,##0€');
  sheet.getRange('K2:K10000').setNumberFormat('0.00%');
  sheet.getRange('L2:L10000').setNumberFormat('#,##0€');

  // Formattazione condizionale per variazioni
  const variazioneRange = sheet.getRange('H2:H10000');
  const positivaRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0)
    .setFontColor('#38761D')
    .setBold(true)
    .setRanges([variazioneRange])
    .build();

  const negativaRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0)
    .setFontColor('#CC0000')
    .setBold(true)
    .setRanges([variazioneRange])
    .build();

  sheet.setConditionalFormatRules([positivaRule, negativaRule]);

  // Larghezza colonne
  sheet.setColumnWidth(1, 120);
  sheet.setColumnWidth(2, 110);
  sheet.setColumnWidth(3, 180);
  sheet.setColumnWidths(4, 2, 110);
  sheet.setColumnWidth(6, 150);
  sheet.setColumnWidths(7, 3, 120);
  sheet.setColumnWidth(10, 200);
  sheet.setColumnWidths(11, 2, 100);
  sheet.setColumnWidth(13, 300);
  sheet.setColumnWidth(14, 120);

  // Summary AUM
  sheet.getRange('A10003').setValue('═══ AUM SUMMARY ═══').setFontWeight('bold').setFontSize(12);

  const summaryData = [
    ['AUM Totale Attuale', '=SUMIF(C2:C10000,"<>",I2:I10000)'],
    ['Nuove Acquisizioni (Mese)', '=SUMIFS(H2:H10000,F2:F10000,"Nuova Acquisizione",B2:B10000,">="&EOMONTH(TODAY(),-1)+1)'],
    ['Versamenti (Mese)', '=SUMIFS(H2:H10000,F2:F10000,"Versamento Aggiuntivo",B2:B10000,">="&EOMONTH(TODAY(),-1)+1)'],
    ['Prelievi (Mese)', '=SUMIFS(H2:H10000,F2:F10000,"Prelievo*",B2:B10000,">="&EOMONTH(TODAY(),-1)+1)'],
    ['Performance (Mese)', '=SUMIFS(H2:H10000,F2:F10000,"Performance*",B2:B10000,">="&EOMONTH(TODAY(),-1)+1)'],
    ['Numero Clienti Attivi', '=COUNTA(UNIQUE(FILTER(C2:C10000,C2:C10000<>"")))']
  ];
  sheet.getRange(10005, 1, summaryData.length, 2).setValues(summaryData);
  sheet.getRange('A10005:A10010').setFontWeight('bold');
  sheet.getRange('B10005:B10009').setNumberFormat('#,##0€');
}

// ═══════════════════════════════════════════════════════════════════
// SETUP CHIAMATE & FOLLOW-UP
// ═══════════════════════════════════════════════════════════════════

function setupChiamateFollowUp(ss) {
  const sheet = ss.getSheetByName('CHIAMATE & FOLLOW-UP');
  sheet.clear();

  const headers = [
    'Call ID', 'Data Chiamata', 'Ora', 'Contatto', 'Tel', 'Pipeline ID',
    'Tipo', 'Durata (min)', 'Esito', 'Qualità Call', 'Interesse Level',
    'Next Action', 'Data Follow-up', 'Stato Follow-up', 'Note', 'Registrata Da'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#FF9900');
  headerRange.setFontColor('#000000');
  headerRange.setHorizontalAlignment('center');
  sheet.setRowHeight(1, 40);
  sheet.setFrozenRows(1);

  // Formula Call ID
  sheet.getRange('A2').setFormula('="CALL-"&TEXT(ROW()-1,"00000")');
  sheet.getRange('A2').copyTo(sheet.getRange('A2:A10000'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);

  // Data Validation
  sheet.getRange('G2:G10000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList([
        'Cold Call',
        'Follow-up',
        'Discovery Call',
        'Presentazione',
        'Negoziazione',
        'Check-in Cliente',
        'Altro'
      ])
      .build()
  );

  sheet.getRange('I2:I10000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList([
        'Risposto - Interessato',
        'Risposto - Non Interessato',
        'Risposto - Richiamare',
        'No Risposta',
        'Numero Errato',
        'Voicemail Lasciato',
        'Appointment Fissato',
        'Deal Chiuso'
      ])
      .build()
  );

  sheet.getRange('J2:J10000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Ottima', 'Buona', 'Media', 'Scarsa'])
      .build()
  );

  sheet.getRange('K2:K10000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Alto', 'Medio', 'Basso', 'Nullo'])
      .build()
  );

  sheet.getRange('N2:N10000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Da Fare', 'In Programma', 'Completato', 'Annullato'])
      .build()
  );

  // Formattazione condizionale per Esito
  const esitoRange = sheet.getRange('I2:I10000');
  const esitoPositivaRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('Interessato')
    .setBackground('#93C47D')
    .setRanges([esitoRange])
    .build();

  const esitoAppointmentRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('Fissato')
    .setBackground('#38761D')
    .setFontColor('#FFFFFF')
    .setBold(true)
    .setRanges([esitoRange])
    .build();

  const esitoNegativaRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('Non Interessato')
    .setBackground('#F4CCCC')
    .setRanges([esitoRange])
    .build();

  sheet.setConditionalFormatRules([esitoPositivaRule, esitoAppointmentRule, esitoNegativaRule]);

  // Formattazione condizionale per Follow-up in scadenza
  const followUpRange = sheet.getRange('M2:M10000');
  const scadutoRule = SpreadsheetApp.newConditionalFormatRule()
    .whenDateBefore(SpreadsheetApp.RelativeDate.TODAY)
    .setBackground('#EA4335')
    .setFontColor('#FFFFFF')
    .setBold(true)
    .setRanges([followUpRange])
    .build();

  const oggiRule = SpreadsheetApp.newConditionalFormatRule()
    .whenDateEqualTo(SpreadsheetApp.RelativeDate.TODAY)
    .setBackground('#FFD966')
    .setBold(true)
    .setRanges([followUpRange])
    .build();

  sheet.setConditionalFormatRules([esitoPositivaRule, esitoAppointmentRule, esitoNegativaRule, scadutoRule, oggiRule]);

  // Larghezza colonne
  sheet.setColumnWidth(1, 120);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 60);
  sheet.setColumnWidth(4, 180);
  sheet.setColumnWidth(5, 120);
  sheet.setColumnWidth(6, 100);
  sheet.setColumnWidth(7, 120);
  sheet.setColumnWidth(8, 80);
  sheet.setColumnWidth(9, 180);
  sheet.setColumnWidths(10, 2, 100);
  sheet.setColumnWidth(12, 200);
  sheet.setColumnWidth(13, 110);
  sheet.setColumnWidth(14, 120);
  sheet.setColumnWidth(15, 300);
  sheet.setColumnWidth(16, 120);

  // Summary chiamate
  sheet.getRange('A10003').setValue('═══ CHIAMATE SUMMARY ═══').setFontWeight('bold').setFontSize(12);

  const summaryData = [
    ['Chiamate Oggi', '=COUNTIF(B2:B10000,TODAY())'],
    ['Chiamate Settimana', '=COUNTIFS(B2:B10000,">="&TODAY()-WEEKDAY(TODAY())+1,B2:B10000,"<="&TODAY())'],
    ['Chiamate Mese', '=COUNTIFS(B2:B10000,">="&EOMONTH(TODAY(),-1)+1,B2:B10000,"<="&EOMONTH(TODAY(),0))'],
    ['Tasso Risposta %', '=IFERROR(COUNTIFS(I2:I10000,"Risposto*",B2:B10000,">="&EOMONTH(TODAY(),-1)+1)/COUNTIFS(B2:B10000,">="&EOMONTH(TODAY(),-1)+1),0)'],
    ['Tasso Conversione App %', '=IFERROR(COUNTIFS(I2:I10000,"*Fissato",B2:B10000,">="&EOMONTH(TODAY(),-1)+1)/COUNTIFS(B2:B10000,">="&EOMONTH(TODAY(),-1)+1),0)'],
    ['Follow-up Scaduti', '=COUNTIFS(M2:M10000,"<"&TODAY(),N2:N10000,"Da Fare")'],
    ['Follow-up Oggi', '=COUNTIFS(M2:M10000,TODAY(),N2:N10000,"<>Completato")']
  ];
  sheet.getRange(10005, 1, summaryData.length, 2).setValues(summaryData);
  sheet.getRange('A10005:A10011').setFontWeight('bold');
  sheet.getRange('B10008:B10009').setNumberFormat('0.0%');
}

// ═══════════════════════════════════════════════════════════════════
// SETUP TIMELINE INTERAZIONI
// ═══════════════════════════════════════════════════════════════════

function setupTimelineInterazioni(ss) {
  const sheet = ss.getSheetByName('TIMELINE INTERAZIONI');
  sheet.clear();

  const headers = [
    'Timestamp', 'Data', 'Ora', 'Contatto', 'Pipeline ID', 'Tipo Interazione',
    'Canale', 'Durata', 'Stage Prima', 'Stage Dopo', 'Cambio Stage?',
    'Sentiment', 'Azioni Intraprese', 'Documenti Inviati', 'Note Dettagliate', 'Owner'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#0B5394');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  sheet.setRowHeight(1, 40);
  sheet.setFrozenRows(1);

  // Data Validation
  sheet.getRange('F2:F10000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList([
        'Telefonata',
        'Email',
        'Meeting',
        'Video Call',
        'WhatsApp',
        'LinkedIn',
        'Evento',
        'Altro'
      ])
      .build()
  );

  sheet.getRange('G2:G10000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList([
        'Telefono',
        'Email',
        'Video',
        'Di Persona',
        'Social Media',
        'WhatsApp',
        'Altro'
      ])
      .build()
  );

  sheet.getRange('L2:L10000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList([
        'Molto Positivo',
        'Positivo',
        'Neutrale',
        'Negativo',
        'Molto Negativo'
      ])
      .build()
  );

  // Formula Cambio Stage
  sheet.getRange('K2').setFormula('=IF(AND(I2<>"",J2<>""),IF(I2<>J2,"SÌ","NO"),"")');
  sheet.getRange('K2').copyTo(sheet.getRange('K2:K10000'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);

  // Formattazione condizionale Sentiment
  const sentimentRange = sheet.getRange('L2:L10000');
  const sentimentRules = [
    {value: 'Molto Positivo', color: '#38761D', fontColor: '#FFFFFF'},
    {value: 'Positivo', color: '#93C47D'},
    {value: 'Neutrale', color: '#FFE599'},
    {value: 'Negativo', color: '#F4CCCC'},
    {value: 'Molto Negativo', color: '#CC0000', fontColor: '#FFFFFF'}
  ];

  const conditionalRules = sentimentRules.map(rule =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(rule.value)
      .setBackground(rule.color)
      .setFontColor(rule.fontColor || '#000000')
      .setRanges([sentimentRange])
      .build()
  );

  sheet.setConditionalFormatRules(conditionalRules);

  // Larghezza colonne
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 70);
  sheet.setColumnWidth(4, 180);
  sheet.setColumnWidth(5, 100);
  sheet.setColumnWidth(6, 130);
  sheet.setColumnWidth(7, 100);
  sheet.setColumnWidth(8, 80);
  sheet.setColumnWidths(9, 2, 120);
  sheet.setColumnWidth(11, 90);
  sheet.setColumnWidth(12, 130);
  sheet.setColumnWidth(13, 250);
  sheet.setColumnWidth(14, 200);
  sheet.setColumnWidth(15, 350);
  sheet.setColumnWidth(16, 120);
}

// ═══════════════════════════════════════════════════════════════════
// SETUP ANALYTICS
// ═══════════════════════════════════════════════════════════════════

function setupAnalytics(ss) {
  const sheet = ss.getSheetByName('ANALYTICS');
  sheet.clear();

  // Titolo
  sheet.getRange('A1').setValue('📊 ANALYTICS & PERFORMANCE METRICS').setFontSize(16).setFontWeight('bold');

  // SEZIONE 1: KPI Principali
  sheet.getRange('A3').setValue('═══ KPI PRINCIPALI ═══').setFontWeight('bold').setFontSize(12);

  const kpiHeaders = ['METRICA', 'VALORE ATTUALE', 'TARGET', 'DELTA', 'TREND', 'STATUS'];
  sheet.getRange(5, 1, 1, 6).setValues([kpiHeaders]);
  sheet.getRange('A5:F5').setFontWeight('bold').setBackground('#434343').setFontColor('#FFFFFF');

  const kpiData = [
    ['AUM Totale', '="REGISTRO AUM"!B10005', '=CONFIGURAZIONE!B22', '=B6-C6', '', '=IF(D6>=0,"✅","⚠️")'],
    ['Numero Clienti', '="DATABASE CONTATTI"!COUNTIF(N:N,"SÌ")', '=CONFIGURAZIONE!B23', '=B7-C7', '', '=IF(B7>=C7,"✅","⚠️")'],
    ['AUM Medio Cliente', '=IF(B7>0,B6/B7,0)', '=CONFIGURAZIONE!B24', '=B8-C8', '', '=IF(B8>=C8,"✅","⚠️")'],
    ['Pipeline Value', '=PIPELINE!B1006', 15000000, '=B9-C9', '', '=IF(B9>=C9,"✅","⚠️")'],
    ['Deal Attivi', '=PIPELINE!B1007', 50, '=B10-C10', '', '=IF(B10>=C10,"✅","⚠️")'],
    ['Tasso Conversione', '=PIPELINE!B1011', '=CONFIGURAZIONE!B40', '=B11-C11', '', '=IF(B11>=C11,"✅","⚠️")']
  ];
  sheet.getRange(6, 1, kpiData.length, 6).setValues(kpiData);

  // SEZIONE 2: Metriche di Attività
  sheet.getRange('A15').setValue('═══ METRICHE ATTIVITÀ (30 GIORNI) ═══').setFontWeight('bold').setFontSize(12);

  const attivitaHeaders = ['METRICA', 'VALORE'];
  sheet.getRange(17, 1, 1, 2).setValues([attivitaHeaders]);
  sheet.getRange('A17:B17').setFontWeight('bold').setBackground('#CCCCCC');

  const attivitaData = [
    ['Chiamate Effettuate', '=COUNTIFS("CHIAMATE & FOLLOW-UP"!B:B,">="&TODAY()-30)'],
    ['Email Inviate', '=COUNTIFS("TIMELINE INTERAZIONI"!F:F,"Email","TIMELINE INTERAZIONI"!B:B,">="&TODAY()-30)'],
    ['Meeting Tenuti', '=COUNTIFS("TIMELINE INTERAZIONI"!F:F,"Meeting","TIMELINE INTERAZIONI"!B:B,">="&TODAY()-30)'],
    ['Nuovi Contatti Aggiunti', '=COUNTIFS("DATABASE CONTATTI"!K:K,">="&TODAY()-30)'],
    ['Nuovi Deal Creati', '=COUNTIFS(PIPELINE!G:G,">="&TODAY()-30)'],
    ['Deal Chiusi Vinti', '=COUNTIFS(PIPELINE!H:H,"Cliente Attivo",PIPELINE!R:R,">="&TODAY()-30)'],
    ['Deal Chiusi Persi', '=COUNTIFS(PIPELINE!H:H,"Chiuso Perso",PIPELINE!R:R,">="&TODAY()-30)'],
    ['Contratti Firmati', '=COUNTIFS("GESTIONE CONTRATTI"!H:H,">="&TODAY()-30)']
  ];
  sheet.getRange(18, 1, attivitaData.length, 2).setValues(attivitaData);

  // SEZIONE 3: Velocity & Tempo
  sheet.getRange('A29').setValue('═══ VELOCITY & TEMPO MEDIO ═══').setFontWeight('bold').setFontSize(12);

  const velocityHeaders = ['METRICA', 'GIORNI MEDI'];
  sheet.getRange(31, 1, 1, 2).setValues([velocityHeaders]);
  sheet.getRange('A31:B31').setFontWeight('bold').setBackground('#CCCCCC');

  const velocityData = [
    ['Lead → Qualificato', '=AVERAGEIFS(PIPELINE!J:J,PIPELINE!H:H,"Qualificato")'],
    ['Qualificato → Proposta', '=AVERAGEIFS(PIPELINE!J:J,PIPELINE!H:H,"Proposta Inviata")'],
    ['Proposta → Negoziazione', '=AVERAGEIFS(PIPELINE!J:J,PIPELINE!H:H,"Negoziazione")'],
    ['Negoziazione → Contratto', '=AVERAGEIFS(PIPELINE!J:J,PIPELINE!H:H,"Contratto Inviato")'],
    ['Contratto → Cliente', '=AVERAGEIFS(PIPELINE!J:J,PIPELINE!H:H,"Cliente Attivo")'],
    ['Lead → Cliente (totale)', '=AVERAGE(FILTER(PIPELINE!J:J,PIPELINE!H:H="Cliente Attivo"))']
  ];
  sheet.getRange(32, 1, velocityData.length, 2).setValues(velocityData);

  // SEZIONE 4: Performance per Fonte
  sheet.getRange('D3').setValue('═══ PERFORMANCE PER FONTE ═══').setFontWeight('bold').setFontSize(12);

  const fonteHeaders = ['FONTE', 'LEAD', 'CLIENTI', 'CONV %', 'AUM'];
  sheet.getRange(5, 4, 1, 5).setValues([fonteHeaders]);
  sheet.getRange('D5:H5').setFontWeight('bold').setBackground('#434343').setFontColor('#FFFFFF');

  // Le fonti verranno popolate dinamicamente

  // SEZIONE 5: Pipeline Health
  sheet.getRange('D17').setValue('═══ PIPELINE HEALTH ═══').setFontWeight('bold').setFontSize(12);

  const healthHeaders = ['STAGE', 'NUMERO', 'VALORE €', '% TOTALE'];
  sheet.getRange(19, 4, 1, 4).setValues([healthHeaders]);
  sheet.getRange('D19:G19').setFontWeight('bold').setBackground('#434343').setFontColor('#FFFFFF');

  // Gli stage verranno popolati dinamicamente

  // Formattazione
  sheet.getRange('B6:B11').setNumberFormat('#,##0');
  sheet.getRange('C6:C11').setNumberFormat('#,##0');
  sheet.getRange('D6:D11').setNumberFormat('#,##0');
  sheet.getRange('B8').setNumberFormat('#,##0€');
  sheet.getRange('C8').setNumberFormat('#,##0€');
  sheet.getRange('D8').setNumberFormat('#,##0€');
  sheet.getRange('B11').setNumberFormat('0.0%');
  sheet.getRange('C11').setNumberFormat('0.0%');
  sheet.getRange('D11').setNumberFormat('0.0%');

  // Larghezza colonne
  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidths(2, 5, 120);
}

// ═══════════════════════════════════════════════════════════════════
// SETUP FUNNEL GENERALE
// ═══════════════════════════════════════════════════════════════════

function setupFunnelGenerale(ss) {
  const sheet = ss.getSheetByName('FUNNEL GENERALE');
  sheet.clear();

  const headers = [
    'Settimana', 'Data Inizio', 'Data Fine', 'Lead Nuovi', 'Chiamate', 'Email',
    'Meeting Fissati', 'Meeting Fatti', 'No-Show', 'Prospect Qualificati',
    'Proposte Inviate', 'Clienti Chiusi', 'AUM Week', 'AUM Cumulativo',
    'Spesa Marketing €', 'CAC €', 'ROI %'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#00FF00');
  headerRange.setFontColor('#000000');
  headerRange.setHorizontalAlignment('center');
  sheet.setRowHeight(1, 40);
  sheet.setFrozenRows(1);

  // Formula No-Show
  sheet.getRange('I2').setFormula('=IF(AND(G2>0,H2>0),G2-H2,"")');

  // Formula AUM Cumulativo
  sheet.getRange('N2').setFormula('=IF(M2<>"",M2,"")');
  sheet.getRange('N3').setFormula('=IF(M3<>"",N2+M3,"")');

  // Formula CAC
  sheet.getRange('P2').setFormula('=IF(AND(L2>0,O2>0),O2/L2,"")');

  // Formula ROI
  sheet.getRange('Q2').setFormula('=IF(AND(M2>0,O2>0),(M2*0.005-O2)/O2,"")');

  // Copia formule
  sheet.getRange('I2').copyTo(sheet.getRange('I2:I53'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);
  sheet.getRange('N3').copyTo(sheet.getRange('N3:N53'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);
  sheet.getRange('P2').copyTo(sheet.getRange('P2:P53'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);
  sheet.getRange('Q2').copyTo(sheet.getRange('Q2:Q53'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);

  // Formattazione
  sheet.getRange('M2:N53').setNumberFormat('#,##0€');
  sheet.getRange('O2:P53').setNumberFormat('#,##0€');
  sheet.getRange('Q2:Q53').setNumberFormat('0.0%');

  // TOTALI
  sheet.getRange('A55').setValue('═══ TOTALI ═══').setFontWeight('bold');

  const totaliData = [
    ['TOTALE ANNO', '=SUM(D2:D53)', '=SUM(E2:E53)', '=SUM(F2:F53)', '=SUM(G2:G53)',
     '=SUM(H2:H53)', '=SUM(I2:I53)', '=SUM(J2:J53)', '=SUM(K2:K53)', '=SUM(L2:L53)',
     '=SUM(M2:M53)', '', '=SUM(O2:O53)', '=IF(L56>0,O56/L56,"")', '']
  ];
  sheet.getRange(56, 1, 1, 15).setValues(totaliData);
  sheet.getRange('A56:Q56').setFontWeight('bold').setBackground('#FFF2CC');

  // MEDIE
  sheet.getRange('A58').setValue('═══ MEDIE ═══').setFontWeight('bold');

  const medieData = [
    ['MEDIA SETTIMANALE', '=AVERAGE(D2:D53)', '=AVERAGE(E2:E53)', '=AVERAGE(F2:F53)',
     '=AVERAGE(G2:G53)', '=AVERAGE(H2:H53)', '=AVERAGE(I2:I53)', '=AVERAGE(J2:J53)',
     '=AVERAGE(K2:K53)', '=AVERAGE(L2:L53)', '=AVERAGE(M2:M53)', '', '=AVERAGE(O2:O53)', '', '']
  ];
  sheet.getRange(59, 1, 1, 15).setValues(medieData);
  sheet.getRange('A59:Q59').setFontWeight('bold').setBackground('#D9EAD3');

  // CONVERSION RATES
  sheet.getRange('A62').setValue('═══ TASSI DI CONVERSIONE ═══').setFontWeight('bold');

  const conversionData = [
    ['Lead → Meeting %', '=IF(D56>0,G56/D56,0)'],
    ['Meeting → Qualificato %', '=IF(H56>0,J56/H56,0)'],
    ['Qualificato → Proposta %', '=IF(J56>0,K56/J56,0)'],
    ['Proposta → Cliente %', '=IF(K56>0,L56/K56,0)'],
    ['Lead → Cliente % (TOTALE)', '=IF(D56>0,L56/D56,0)'],
    ['No-Show Rate %', '=IF(G56>0,I56/G56,0)']
  ];
  sheet.getRange(64, 1, conversionData.length, 2).setValues(conversionData);
  sheet.getRange('A64:A69').setFontWeight('bold');
  sheet.getRange('B64:B69').setNumberFormat('0.0%');

  // Larghezza colonne
  for (let i = 1; i <= 17; i++) {
    sheet.setColumnWidth(i, 110);
  }
  sheet.setColumnWidth(1, 150);
}
