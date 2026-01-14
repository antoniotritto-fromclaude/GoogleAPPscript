/**
 * ECOSISTEMA ACQUISIZIONE - SETUP AUTOMATICO CON DATI ESEMPIO
 * by Antonio Tritto - Private Banking System
 *
 * Questo script crea automaticamente:
 * - 12 sheet strutturati
 * - Intestazioni formattate
 * - Formule automatiche
 * - Convalide dati
 * - Formattazione condizionale
 * - DATI DI ESEMPIO per vedere subito come funziona
 */

function setupEcosistemaAcquisizione() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // STEP 1: Crea sheet base
  Logger.log('Creazione sheet...');
  createSheets(ss);

  // STEP 2: Popola Configurazione
  Logger.log('Setup Configurazione...');
  setupConfigurazione(ss);

  // STEP 3: Setup Database Contatti
  Logger.log('Setup Database Contatti...');
  setupDatabaseContatti(ss);

  // STEP 4: Setup Pipeline
  Logger.log('Setup Pipeline...');
  setupPipeline(ss);

  // STEP 5: Setup Funnel Generale
  Logger.log('Setup Funnel Generale...');
  setupFunnelGenerale(ss);

  // STEP 6: Setup altri sheet
  Logger.log('Setup altri sheet...');
  setupNewsletter(ss);
  setupColdCalling(ss);
  setupPartnership(ss);
  setupTFREntry(ss);
  setupEventiLibro(ss);
  setupPercorsiFormativi(ss);
  setupRisultatiMensili(ss);

  // STEP 7: Setup Dashboard (DOPO tutti gli altri per formule corrette)
  Logger.log('Setup Dashboard...');
  setupDashboard(ss);

  // STEP 8: POPOLA DATI ESEMPIO
  Logger.log('Inserimento dati esempio...');
  popolaDatiEsempio(ss);

  SpreadsheetApp.getUi().alert(
    '✅ SETUP COMPLETATO!\n\n' +
    '📊 Dashboard popolata con dati esempio\n' +
    '👥 50 contatti inseriti\n' +
    '💼 15 prospect in pipeline\n' +
    '📈 4 settimane di tracking\n\n' +
    'Vai su DASHBOARD per vedere il risultato!'
  );
}

// ========================================
// FUNZIONE 1: CREA TUTTI GLI SHEET
// ========================================
function createSheets(ss) {
  const sheets = [
    {name: 'DASHBOARD', color: '#1155CC'},
    {name: 'FUNNEL GENERALE', color: '#00FF00'},
    {name: 'NEWSLETTER', color: '#FFFF00'},
    {name: 'COLD CALLING', color: '#FF9900'},
    {name: 'PARTNERSHIP', color: '#9900FF'},
    {name: 'TFR ENTRY', color: '#FF0000'},
    {name: 'EVENTI LIBRO', color: '#A64D79'},
    {name: 'PERCORSI FORMATIVI', color: '#00FFFF'},
    {name: 'PIPELINE', color: '#38761D'},
    {name: 'DATABASE CONTATTI', color: '#CCCCCC'},
    {name: 'RISULTATI MENSILI', color: '#FFD966'},
    {name: 'CONFIGURAZIONE', color: '#000000'}
  ];

  // Rimuovi sheet esistenti (tranne il primo)
  const existingSheets = ss.getSheets();
  for (let i = existingSheets.length - 1; i > 0; i--) {
    ss.deleteSheet(existingSheets[i]);
  }

  // Rinomina primo sheet
  existingSheets[0].setName('DASHBOARD');
  existingSheets[0].setTabColor('#1155CC');

  // Crea i restanti
  for (let i = 1; i < sheets.length; i++) {
    const newSheet = ss.insertSheet(sheets[i].name);
    newSheet.setTabColor(sheets[i].color);
  }
}

// ========================================
// FUNZIONE 2: SETUP CONFIGURAZIONE
// ========================================
function setupConfigurazione(ss) {
  const sheet = ss.getSheetByName('CONFIGURAZIONE');

  // Sezione A: Liste Dropdown
  const categorieData = [
    ['CATEGORIA'],
    ['Imprenditore'],
    ['Commercialista'],
    ['Avvocato'],
    ['Odontoiatra'],
    ['Consulente Lavoro'],
    ['PMI'],
    ['Altro']
  ];
  sheet.getRange(2, 1, categorieData.length, 1).setValues(categorieData);

  const stageData = [
    ['STAGE'],
    ['Lead'],
    ['Qualificato'],
    ['Proposta'],
    ['Negoziazione'],
    ['Chiuso Vinto'],
    ['Chiuso Perso']
  ];
  sheet.getRange(2, 2, stageData.length, 1).setValues(stageData);

  const tierData = [
    ['TIER'],
    ['A (HOT)'],
    ['B (WARM)'],
    ['C (COLD)']
  ];
  sheet.getRange(2, 3, tierData.length, 1).setValues(tierData);

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
    ['Altro']
  ];
  sheet.getRange(2, 4, fonteData.length, 1).setValues(fonteData);

  // Sezione B: Target Annuali
  const targetData = [
    ['AUM Target Anno', 15000000],
    ['Clienti Target Anno', 150],
    ['AUM Medio Target', 100000],
    ['Budget Annuale', 10000],
    ['CAC Target', 67],
    ['Fee % Media', 0.005],
    ['Ricavo Annuo Target', '=B17*B18']
  ];
  sheet.getRange(12, 1, targetData.length, 2).setValues(targetData);

  // Formattazione
  sheet.getRange('A2:D2').setFontWeight('bold');
  sheet.getRange('A12:A18').setFontWeight('bold');
  sheet.getRange('B12:B17').setNumberFormat('#,##0');
  sheet.getRange('B18').setNumberFormat('0.0%');
}

// ========================================
// FUNZIONE 3: SETUP DATABASE CONTATTI
// ========================================
function setupDatabaseContatti(ss) {
  const sheet = ss.getSheetByName('DATABASE CONTATTI');

  // Intestazioni
  const headers = [
    'ID', 'Nome', 'Cognome', 'Azienda', 'Ruolo', 'Email', 'Tel', 'LinkedIn',
    'Categoria', 'Fonte', 'Tier', 'Ultimo Contatto', 'Engagement', 'Cliente?', 'AUM', 'Note'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Formattazione intestazioni
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#F3F3F3');
  headerRange.setHorizontalAlignment('center');

  // Congela riga 1
  sheet.setFrozenRows(1);

  // Convalida dati
  const configSheet = ss.getSheetByName('CONFIGURAZIONE');

  const categoriaRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(configSheet.getRange('A3:A9'))
    .build();
  sheet.getRange('I2:I1000').setDataValidation(categoriaRule);

  const fonteRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(configSheet.getRange('D3:D13'))
    .build();
  sheet.getRange('J2:J1000').setDataValidation(fonteRule);

  const tierRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(configSheet.getRange('C3:C5'))
    .build();
  sheet.getRange('K2:K1000').setDataValidation(tierRule);

  const clienteRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SÌ', 'NO'])
    .build();
  sheet.getRange('N2:N1000').setDataValidation(clienteRule);

  // Larghezza colonne
  sheet.setColumnWidth(1, 50);
  sheet.setColumnWidths(2, 3, 120);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(6, 200);
  sheet.setColumnWidth(8, 250);
  sheet.setColumnWidth(16, 300);
}

// ========================================
// FUNZIONE 4: SETUP PIPELINE
// ========================================
function setupPipeline(ss) {
  const sheet = ss.getSheetByName('PIPELINE');

  const headers = [
    'Prospect', 'Azienda', 'Fonte', 'Categoria', 'Patrim Stimato', 'Data Ingresso',
    'Stage', 'Probabilità %', 'Next Action', 'Data Next', 'Ultima Interazione', 'Note', 'Previsto Chiusura'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#F3F3F3');
  headerRange.setHorizontalAlignment('center');

  sheet.setFrozenRows(1);

  const configSheet = ss.getSheetByName('CONFIGURAZIONE');

  sheet.getRange('C2:C1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(configSheet.getRange('D3:D13'))
      .build()
  );

  sheet.getRange('D2:D1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(configSheet.getRange('A3:A9'))
      .build()
  );

  sheet.getRange('G2:G1000').setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(configSheet.getRange('B3:B8'))
      .build()
  );

  // Formula Probabilità
  sheet.getRange('H2').setFormula('=IF(G2="Lead",10%,IF(G2="Qualificato",30%,IF(G2="Proposta",50%,IF(G2="Negoziazione",70%,IF(G2="Chiuso Vinto",100%,0%)))))');
  sheet.getRange('H2:H1000').setNumberFormat('0%');

  // Copia formula in giù
  sheet.getRange('H2').copyTo(sheet.getRange('H3:H1000'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);

  // Formattazione condizionale Stage
  const stageRange = sheet.getRange('G2:G1000');

  const rules = [
    {value: 'Lead', color: '#EFEFEF'},
    {value: 'Qualificato', color: '#FFF2CC'},
    {value: 'Proposta', color: '#FCE5CD'},
    {value: 'Negoziazione', color: '#D9EAD3'},
    {value: 'Chiuso Vinto', color: '#93C47D'},
    {value: 'Chiuso Perso', color: '#F4CCCC'}
  ];

  const conditionalRules = [];
  rules.forEach(rule => {
    const conditionalRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(rule.value)
      .setBackground(rule.color)
      .setRanges([stageRange])
      .build();
    conditionalRules.push(conditionalRule);
  });
  sheet.setConditionalFormatRules(conditionalRules);

  sheet.getRange('E2:E1000').setNumberFormat('#,##0€');

  // Dashboard Mini
  sheet.getRange('A100').setValue('TOT PIPELINE').setFontWeight('bold');
  sheet.getRange('B100').setFormula('=SUMIF(E2:E99,">0")').setNumberFormat('#,##0€');

  sheet.getRange('A101').setValue('Stage Lead').setFontWeight('bold');
  sheet.getRange('B101').setFormula('=COUNTIF(G2:G99,"Lead")');

  sheet.getRange('A102').setValue('Stage Qualificato').setFontWeight('bold');
  sheet.getRange('B102').setFormula('=COUNTIF(G2:G99,"Qualificato")');

  sheet.getRange('A103').setValue('Stage Proposta').setFontWeight('bold');
  sheet.getRange('B103').setFormula('=COUNTIF(G2:G99,"Proposta")');

  sheet.getRange('A104').setValue('Stage Negoziazione').setFontWeight('bold');
  sheet.getRange('B104').setFormula('=COUNTIF(G2:G99,"Negoziazione")');
}

// ========================================
// FUNZIONE 5: SETUP FUNNEL GENERALE
// ========================================
function setupFunnelGenerale(ss) {
  const sheet = ss.getSheetByName('FUNNEL GENERALE');

  const headers = [
    'Settimana', 'Data Inizio', 'Data Fine', 'Lead Tot', 'Chiamate', 'Email Inviate',
    'App Fissati', 'App Fatti', 'No-Show', 'Clienti Chiusi', 'AUM Week', 'AUM Cumulativo'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#F3F3F3');
  headerRange.setHorizontalAlignment('center');

  sheet.setFrozenRows(1);

  // Formula No-Show
  sheet.getRange('I2').setFormula('=G2-H2');
  sheet.getRange('I2').copyTo(sheet.getRange('I3:I53'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);

  // Formula AUM Cumulativo
  sheet.getRange('L2').setFormula('=K2');
  sheet.getRange('L3').setFormula('=L2+K3');
  sheet.getRange('L3').copyTo(sheet.getRange('L4:L53'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);

  sheet.getRange('K2:L53').setNumberFormat('#,##0€');

  // Totali
  sheet.getRange('A54').setValue('TOTALE').setFontWeight('bold');
  sheet.getRange('D54').setFormula('=SUM(D2:D53)');
  sheet.getRange('E54').setFormula('=SUM(E2:E53)');
  sheet.getRange('F54').setFormula('=SUM(F2:F53)');
  sheet.getRange('G54').setFormula('=SUM(G2:G53)');
  sheet.getRange('H54').setFormula('=SUM(H2:H53)');
  sheet.getRange('I54').setFormula('=SUM(I2:I53)');
  sheet.getRange('J54').setFormula('=SUM(J2:J53)');
  sheet.getRange('K54').setFormula('=SUM(K2:K53)');

  // Medie
  sheet.getRange('A55').setValue('MEDIA').setFontWeight('bold');
  sheet.getRange('G55').setFormula('=AVERAGE(G2:G53)');
  sheet.getRange('H55').setFormula('=AVERAGE(H2:H53)');
  sheet.getRange('J55').setFormula('=AVERAGE(J2:J53)');
  sheet.getRange('K55').setFormula('=AVERAGE(K2:K53)').setNumberFormat('#,##0€');

  // Conversion Rate
  sheet.getRange('A57').setValue('Lead → App %').setFontWeight('bold');
  sheet.getRange('B57').setFormula('=G54/D54').setNumberFormat('0.0%');

  sheet.getRange('A58').setValue('App → Cliente %').setFontWeight('bold');
  sheet.getRange('B58').setFormula('=J54/H54').setNumberFormat('0.0%');

  sheet.getRange('A59').setValue('No-Show %').setFontWeight('bold');
  sheet.getRange('B59').setFormula('=I54/G54').setNumberFormat('0.0%');
}

// ========================================
// FUNZIONE 6: SETUP DASHBOARD
// ========================================
function setupDashboard(ss) {
  const sheet = ss.getSheetByName('DASHBOARD');
  sheet.clear();

  // TITOLO
  sheet.getRange('A1:H1').merge();
  sheet.getRange('A1').setValue('🎯 ECOSISTEMA ACQUISIZIONE - DASHBOARD SETTIMANALE');
  sheet.getRange('A1').setFontSize(18);
  sheet.getRange('A1').setFontWeight('bold');
  sheet.getRange('A1').setHorizontalAlignment('center');
  sheet.getRange('A1').setBackground('#1155CC');
  sheet.getRange('A1').setFontColor('#FFFFFF');

  // INFO SETTIMANA
  const infoData = [
    ['SETTIMANA:', 1, 'DATA:', new Date().toLocaleDateString('it-IT'), 'AUM TARGET ANNO:', '=CONFIGURAZIONE!$B$12', 'AUM ATTUALE:', "='FUNNEL GENERALE'!L2"]
  ];
  sheet.getRange(3, 1, 1, 8).setValues(infoData);
  sheet.getRange('A3:H3').setFontWeight('bold');
  sheet.getRange('F3').setNumberFormat('#,##0€');
  sheet.getRange('H3').setNumberFormat('#,##0€');

  // KPI LEVE
  sheet.getRange('A5:F5').setValues([['LEVA', 'LEAD SETT', 'APP FISSATI', 'APP FATTI', 'CLIENTI CHIUSI', 'AUM AGGIUNTO']]);
  sheet.getRange('A5:F5').setFontWeight('bold').setBackground('#CCCCCC');

  const leveData = [
    ['Newsletter', 0, 0, 0, 0, 0],
    ['Cold Calling', 0, 0, 0, 0, 0],
    ['Partnership', 0, 0, 0, 0, 0],
    ['TFR Entry', 0, 0, 0, 0, 0],
    ['Eventi Libro', 0, 0, 0, 0, 0],
    ['Percorsi Form.', 0, 0, 0, 0, 0],
    ['TOTALE SETTIMANA', '=SUM(B6:B11)', '=SUM(C6:C11)', '=SUM(D6:D11)', '=SUM(E6:E11)', '=SUM(F6:F11)']
  ];
  sheet.getRange(6, 1, leveData.length, 6).setValues(leveData);
  sheet.getRange('A12:F12').setFontWeight('bold').setBackground('#FFF2CC');
  sheet.getRange('F6:F12').setNumberFormat('#,##0€');

  // CONVERSIONI
  sheet.getRange('A15:E15').setValues([['METRICA', 'VALORE', 'TARGET', 'DELTA', 'STATUS']]);
  sheet.getRange('A15:E15').setFontWeight('bold').setBackground('#CCCCCC');

  const convData = [
    ['Lead → App %', '=IF(B12>0,C12/B12,0)', '15%', '=B16-C16', '=IF(D16>=0,"✅","⚠️")'],
    ['App → Cliente %', '=IF(D12>0,E12/D12,0)', '20%', '=B17-C17', '=IF(D17>=0,"✅","⚠️")'],
    ['AUM Medio', '=IF(E12>0,F12/E12,0)', 100000, '=B18-C18', '=IF(D18>=0,"✅","⚠️")'],
    ['No-Show Rate %', '=IF(C12>0,(C12-D12)/C12,0)', '20%', '=C19-B19', '=IF(D19<=0,"✅","⚠️")']
  ];
  sheet.getRange(16, 1, convData.length, 5).setValues(convData);
  sheet.getRange('B16:B17').setNumberFormat('0.0%');
  sheet.getRange('C16:C17').setNumberFormat('0.0%');
  sheet.getRange('D16:D17').setNumberFormat('0.0%');
  sheet.getRange('B18').setNumberFormat('#,##0€');
  sheet.getRange('C18').setNumberFormat('#,##0€');
  sheet.getRange('D18').setNumberFormat('#,##0€');
  sheet.getRange('B19').setNumberFormat('0.0%');
  sheet.getRange('C19').setNumberFormat('0.0%');

  // Formattazione condizionale STATUS
  const statusRange = sheet.getRange('E16:E19');
  const greenRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('✅')
    .setBackground('#93C47D')
    .setRanges([statusRange])
    .build();
  const redRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('⚠️')
    .setBackground('#F4CCCC')
    .setRanges([statusRange])
    .build();
  sheet.setConditionalFormatRules([greenRule, redRule]);

  // AZIONI SETTIMANA
  sheet.getRange('A25').setValue('⚡ TOP 3 AZIONI QUESTA SETTIMANA');
  sheet.getRange('A25').setFontSize(14).setFontWeight('bold');

  sheet.getRange('A27').setValue('☐ 100 cold call (20/giorno)');
  sheet.getRange('A28').setValue('☐ Inviare 2 newsletter');
  sheet.getRange('A29').setValue('☐ Follow-up 10 prospect pipeline');

  // ALERT
  sheet.getRange('A35').setValue('🚨 ALERT');
  sheet.getRange('A35').setFontSize(14).setFontWeight('bold').setFontColor('#FF0000');

  sheet.getRange('A37').setFormula('=IF(E12<2,"⚠️ POCHI CLIENTI CHIUSI QUESTA SETTIMANA","")');
  sheet.getRange('A38').setFormula('=IF(B16<10%,"⚠️ CONVERSIONE LEAD→APP TROPPO BASSA","")');
  sheet.getRange('A39').setFormula('=IF(COUNTIF(PIPELINE!G:G,"Negoziazione")>10,"⚠️ TROPPE TRATTATIVE APERTE, CHIUDI!","")');

  sheet.getRange('A37:A39').setFontColor('#FF0000').setFontWeight('bold');
}

// ========================================
// FUNZIONI SETUP ALTRI SHEET
// ========================================

function setupNewsletter(ss) {
  const sheet = ss.getSheetByName('NEWSLETTER');
  const headers = ['#', 'Data Invio', 'Tipo', 'Oggetto', 'Invii', 'Open', 'Open %', 'Click', 'Click %', 'Test Scaricati', 'Check-up Prenotati', 'Clienti', 'Note'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F3F3F3');
  sheet.setFrozenRows(1);

  sheet.getRange('G2').setFormula('=IF(F2>0,F2/E2,"")');
  sheet.getRange('I2').setFormula('=IF(H2>0,H2/F2,"")');
  sheet.getRange('G2:G100').setNumberFormat('0.0%');
  sheet.getRange('I2:I100').setNumberFormat('0.0%');

  // Copia formule
  sheet.getRange('G2:I2').copyTo(sheet.getRange('G3:I100'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);
}

function setupColdCalling(ss) {
  const sheet = ss.getSheetByName('COLD CALLING');
  const headers = ['Data', 'Ora', 'Nome', 'Azienda', 'Tel', 'Categoria', 'Contatto?', 'Esito', 'App Fissato?', 'Data App', 'Fatto?', 'Cliente?', 'AUM', 'Note'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F3F3F3');
  sheet.setFrozenRows(1);

  const configSheet = ss.getSheetByName('CONFIGURAZIONE');
  sheet.getRange('F2:F1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(configSheet.getRange('A3:A9')).build());
  sheet.getRange('G2:G1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['SÌ', 'NO']).build());
  sheet.getRange('I2:I1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['SÌ', 'NO']).build());
  sheet.getRange('K2:K1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['SÌ', 'NO']).build());
  sheet.getRange('L2:L1000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['SÌ', 'NO']).build());

  sheet.getRange('M2:M1000').setNumberFormat('#,##0€');
}

function setupPartnership(ss) {
  const sheet = ss.getSheetByName('PARTNERSHIP');
  const headers = ['Partner', 'Tipo', 'Città', 'Contatto', 'Tel/Email', 'Data Attivazione', 'Webinar Partecipati', 'Co-Consulenze', 'Clienti Portati', 'AUM Portato', 'Status', 'Note'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F3F3F3');
  sheet.setFrozenRows(1);

  sheet.getRange('J2:J100').setNumberFormat('#,##0€');
}

function setupTFREntry(ss) {
  const sheet = ss.getSheetByName('TFR ENTRY');
  const headers = ['Azienda', 'Settore', 'N° Dip', 'Data Contatto', 'Data Incontro Dip', 'Adesioni N°', 'Adesioni %', 'Dip→Clienti', 'AUM Dip', 'Liq Az?', 'AUM Liq Az', 'Patrim Soci?', 'AUM Soci', 'Referral', 'AUM TOT', 'Note'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F3F3F3');
  sheet.setFrozenRows(1);

  sheet.getRange('G2').setFormula('=IF(C2>0,F2/C2,"")');
  sheet.getRange('O2').setFormula('=I2+K2+M2');
  sheet.getRange('G2:G100').setNumberFormat('0.0%');
  sheet.getRange('I2:I100').setNumberFormat('#,##0€');
  sheet.getRange('K2:K100').setNumberFormat('#,##0€');
  sheet.getRange('M2:M100').setNumberFormat('#,##0€');
  sheet.getRange('O2:O100').setNumberFormat('#,##0€');

  // Copia formule
  sheet.getRange('G2').copyTo(sheet.getRange('G3:G100'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);
  sheet.getRange('O2').copyTo(sheet.getRange('O3:O100'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);

  sheet.getRange('J2:J100').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['SÌ', 'NO']).build());
  sheet.getRange('L2:L100').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['SÌ', 'NO']).build());
}

function setupEventiLibro(ss) {
  const sheet = ss.getSheetByName('EVENTI LIBRO');
  const headers = ['#', 'Data', 'Location', 'Tema', 'Partecipanti', 'Biglietti Presi', 'Contatti', 'Analisi Fatte', 'Clienti', 'AUM'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F3F3F3');
  sheet.setFrozenRows(1);

  sheet.getRange('J2:J100').setNumberFormat('#,##0€');
}

function setupPercorsiFormativi(ss) {
  const sheet = ss.getSheetByName('PERCORSI FORMATIVI');
  const headers = ['Percorso', 'Edizione', 'Data Inizio', 'Partecipanti', 'Mod1', 'Mod2', 'Mod3', 'Mod4', 'Consulenze Flash', 'Secondi Pareri', 'Clienti', 'AUM', 'Note'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F3F3F3');
  sheet.setFrozenRows(1);

  sheet.getRange('L2:L100').setNumberFormat('#,##0€');
}

function setupRisultatiMensili(ss) {
  const sheet = ss.getSheetByName('RISULTATI MENSILI');
  const headers = ['Mese', 'Lead', 'App', 'Clienti', 'AUM Mese', 'AUM Cumulativo', 'CAC', 'AUM Medio', 'Budget Speso', 'ROI', 'Top Leva', 'Note'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#F3F3F3');
  sheet.setFrozenRows(1);

  sheet.getRange('G2').setFormula('=IF(D2>0,I2/D2,"")');
  sheet.getRange('H2').setFormula('=IF(D2>0,E2/D2,"")');
  sheet.getRange('J2').setFormula('=IF(I2>0,(E2*0.005)/I2,"")');
  sheet.getRange('G2:G13').setNumberFormat('#,##0€');
  sheet.getRange('H2:H13').setNumberFormat('#,##0€');
  sheet.getRange('E2:F13').setNumberFormat('#,##0€');
  sheet.getRange('I2:I13').setNumberFormat('#,##0€');
  sheet.getRange('J2:J13').setNumberFormat('0.0%');

  // Copia formule
  sheet.getRange('G2:J2').copyTo(sheet.getRange('G3:J13'), SpreadsheetApp.CopyPasteType.PASTE_FORMULA);
}

// ========================================
// FUNZIONE PRINCIPALE: POPOLA DATI ESEMPIO
// ========================================
function popolaDatiEsempio(ss) {
  popolaDatabaseContatti(ss);
  popolaPipeline(ss);
  popolaFunnelGenerale(ss);
  popolaNewsletter(ss);
  popolaColdCalling(ss);
  popolaPartnership(ss);
  popolaTFREntry(ss);
  popolaEventiLibro(ss);
  popolaPercorsiFormativi(ss);
}

// ========================================
// DATI ESEMPIO: DATABASE CONTATTI (50 contatti)
// ========================================
function popolaDatabaseContatti(ss) {
  const sheet = ss.getSheetByName('DATABASE CONTATTI');

  const nomi = ['Mario', 'Luca', 'Giuseppe', 'Francesco', 'Alessandro', 'Marco', 'Andrea', 'Paolo', 'Carlo', 'Giovanni',
    'Luigi', 'Antonio', 'Stefano', 'Roberto', 'Davide', 'Simone', 'Matteo', 'Lorenzo', 'Riccardo', 'Filippo',
    'Giorgio', 'Emanuele', 'Daniele', 'Fabio', 'Michele', 'Claudio', 'Massimo', 'Federico', 'Nicola', 'Vincenzo'];

  const cognomi = ['Rossi', 'Bianchi', 'Verdi', 'Neri', 'Russo', 'Ferrari', 'Esposito', 'Colombo', 'Ricci', 'Marino',
    'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Costa', 'Giordano', 'Mancini', 'Rizzo', 'Lombardi',
    'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini'];

  const categorie = ['Commercialista', 'Avvocato', 'Odontoiatra', 'Imprenditore', 'Consulente Lavoro'];
  const fonti = ['Fiera Dental', 'Ex Banca', 'LinkedIn', 'Referral', 'Newsletter'];
  const tiers = ['A (HOT)', 'B (WARM)', 'C (COLD)'];

  const datiContatti = [];

  for (let i = 0; i < 50; i++) {
    const nome = nomi[Math.floor(Math.random() * nomi.length)];
    const cognome = cognomi[Math.floor(Math.random() * cognomi.length)];
    const categoria = categorie[Math.floor(Math.random() * categorie.length)];
    const fonte = fonti[Math.floor(Math.random() * fonti.length)];
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    const engagement = Math.floor(Math.random() * 10) + 1;
    const cliente = Math.random() > 0.7 ? 'SÌ' : 'NO';
    const aum = cliente === 'SÌ' ? Math.floor(Math.random() * 200000) + 50000 : '';

    const dataContatto = new Date();
    dataContatto.setDate(dataContatto.getDate() - Math.floor(Math.random() * 180));

    datiContatti.push([
      String(i + 1).padStart(3, '0'),
      nome,
      cognome,
      `Studio ${cognome}`,
      categoria === 'Imprenditore' ? 'CEO' : categoria,
      `${nome.toLowerCase()}.${cognome.toLowerCase()}@example.com`,
      `081${Math.floor(Math.random() * 10000000)}`,
      `linkedin.com/in/${nome.toLowerCase()}-${cognome.toLowerCase()}`,
      categoria,
      fonte,
      tier,
      dataContatto,
      engagement,
      cliente,
      aum,
      cliente === 'SÌ' ? 'Cliente attivo' : tier === 'A (HOT)' ? 'Molto interessato' : 'Da ricontattare'
    ]);
  }

  sheet.getRange(2, 1, datiContatti.length, 16).setValues(datiContatti);
  sheet.getRange('O2:O51').setNumberFormat('#,##0€');
}

// ========================================
// DATI ESEMPIO: PIPELINE (15 prospect)
// ========================================
function popolaPipeline(ss) {
  const sheet = ss.getSheetByName('PIPELINE');

  const prospect = [
    ['Mario Rossi', 'Studio Rossi & Associati', 'Cold Calling', 'Commercialista', 150000, new Date(2025, 0, 5), 'Negoziazione', '', 'Inviare contratto', new Date(2025, 0, 20), new Date(2025, 0, 15), 'Molto interessato TFR dipendenti', new Date(2025, 0, 25)],
    ['Luca Bianchi', 'Bianchi Legal', 'Partnership', 'Avvocato', 200000, new Date(2025, 0, 8), 'Proposta', '', 'Presentare analisi dettagliata', new Date(2025, 0, 18), new Date(2025, 0, 12), 'Referral da Dott. Verdi', new Date(2025, 0, 28)],
    ['Giuseppe Verdi', 'Studio Dentistico Verdi', 'Fiera Dental', 'Odontoiatra', 180000, new Date(2025, 0, 3), 'Negoziazione', '', 'Follow-up post incontro', new Date(2025, 0, 17), new Date(2025, 0, 14), 'Ha 8 dipendenti, interessato TFR', new Date(2025, 0, 22)],
    ['Francesco Neri', 'Neri Consulting', 'Newsletter', 'Consulente Lavoro', 120000, new Date(2025, 0, 10), 'Qualificato', '', 'Fissare call 45min', new Date(2025, 0, 21), new Date(2025, 0, 16), 'Aperto newsletter, scaricato test', new Date(2025, 0, 30)],
    ['Alessandro Russo', 'Russo & Partners', 'LinkedIn', 'Commercialista', 160000, new Date(2025, 0, 7), 'Proposta', '', 'Inviare simulazione TFR', new Date(2025, 0, 19), new Date(2025, 0, 13), 'Studio con 12 dipendenti', new Date(2025, 0, 27)],
    ['Marco Ferrari', 'Ferrari Srl', 'Cold Calling', 'Imprenditore', 250000, new Date(2024, 11, 20), 'Negoziazione', '', 'Chiudere entro fine mese', new Date(2025, 0, 23), new Date(2025, 0, 10), 'PMI 35 dipendenti, ottimo potenziale', new Date(2025, 0, 31)],
    ['Andrea Esposito', 'Studio Esposito', 'Ex Banca', 'Avvocato', 140000, new Date(2025, 0, 4), 'Qualificato', '', 'Mandare materiali percorso', new Date(2025, 0, 22), new Date(2025, 0, 11), 'Ex cliente, ricontatto positivo', new Date(2025, 1, 5)],
    ['Paolo Colombo', 'Dental Pro', 'Fiera Dental', 'Odontoiatra', 190000, new Date(2025, 0, 6), 'Proposta', '', 'Organizzare incontro dipendenti', new Date(2025, 0, 24), new Date(2025, 0, 15), '10 dipendenti, studio moderno', new Date(2025, 1, 2)],
    ['Carlo Ricci', 'Ricci Tax Service', 'Partnership', 'Commercialista', 130000, new Date(2025, 0, 9), 'Lead', '', 'Prima call conoscitiva', new Date(2025, 0, 25), new Date(2025, 0, 17), 'Contatto da Dott. Marino', new Date(2025, 1, 8)],
    ['Giovanni Marino', 'Marino Industries', 'Referral', 'Imprenditore', 300000, new Date(2024, 11, 15), 'Negoziazione', '', 'Meeting con soci', new Date(2025, 0, 18), new Date(2025, 0, 8), 'Azienda 45 dip, referral cliente', new Date(2025, 0, 26)],
    ['Luigi Greco', 'Studio Greco', 'Cold Calling', 'Consulente Lavoro', 110000, new Date(2025, 0, 11), 'Qualificato', '', 'Inviare case study', new Date(2025, 0, 26), new Date(2025, 0, 18), 'Interessato a partnership', new Date(2025, 1, 10)],
    ['Stefano Bruno', 'Bruno Dental', 'Newsletter', 'Odontoiatra', 170000, new Date(2025, 0, 2), 'Proposta', '', 'Follow-up analisi', new Date(2025, 0, 20), new Date(2025, 0, 14), 'Ha chiesto info su TFR', new Date(2025, 0, 29)],
    ['Roberto Gallo', 'Gallo Legal Advisors', 'LinkedIn', 'Avvocato', 220000, new Date(2025, 0, 1), 'Lead', '', 'Primo contatto telefonico', new Date(2025, 0, 27), new Date(2025, 0, 19), 'Connessione LinkedIn accettata', new Date(2025, 1, 12)],
    ['Davide Conti', 'Conti & Figli Srl', 'Cold Calling', 'Imprenditore', 280000, new Date(2024, 11, 28), 'Proposta', '', 'Presentazione piano completo', new Date(2025, 0, 21), new Date(2025, 0, 9), 'Azienda familiare 40 dip', new Date(2025, 1, 3)],
    ['Simone De Luca', 'Studio De Luca', 'Fiera Dental', 'Odontoiatra', 160000, new Date(2025, 0, 12), 'Qualificato', '', 'Fissare meet 20min', new Date(2025, 0, 28), new Date(2025, 0, 20), 'Contatto fiera, molto cordiale', new Date(2025, 1, 15)]
  ];

  sheet.getRange(2, 1, prospect.length, 13).setValues(prospect);
}

// ========================================
// DATI ESEMPIO: FUNNEL GENERALE (4 settimane)
// ========================================
function popolaFunnelGenerale(ss) {
  const sheet = ss.getSheetByName('FUNNEL GENERALE');
  const oggi = new Date();
  const settimane = [];

  for (let i = 3; i >= 0; i--) {
    const dataInizio = new Date(oggi);
    dataInizio.setDate(oggi.getDate() - (i * 7) - oggi.getDay() + 1);

    const dataFine = new Date(dataInizio);
    dataFine.setDate(dataInizio.getDate() + 6);

    const lead = Math.floor(Math.random() * 30) + 30;
    const chiamate = 100;
    const email = 500;
    const appFissati = Math.floor(lead * 0.25);
    const appFatti = Math.floor(appFissati * 0.75);
    const clienti = Math.floor(appFatti * 0.20);
    const aumWeek = clienti * (Math.floor(Math.random() * 80000) + 80000);

    settimane.push([
      4 - i,
      dataInizio,
      dataFine,
      lead,
      chiamate,
      email,
      appFissati,
      appFatti,
      '', // No-Show (calcolato da formula)
      clienti,
      aumWeek,
      '' // AUM Cumulativo (calcolato da formula)
    ]);
  }

  sheet.getRange(2, 1, settimane.length, 12).setValues(settimane);
}

// ========================================
// DATI ESEMPIO: NEWSLETTER (2 invii)
// ========================================
function popolaNewsletter(ss) {
  const sheet = ss.getSheetByName('NEWSLETTER');

  const newsletter = [
    [1, new Date(2025, 0, 6), 'Caso Studio', 'Come Marco ha perso 40k sul TFR (e come evitarlo)', 500, 215, '', 32, '', 8, 4, 1, 'Ottimo open rate'],
    [2, new Date(2025, 0, 9), 'Tattica', '3 mosse per ridurre costo del lavoro in 60 giorni', 500, 198, '', 28, '', 6, 3, 0, 'Click rate sopra media']
  ];

  sheet.getRange(2, 1, newsletter.length, 13).setValues(newsletter);
}

// ========================================
// DATI ESEMPIO: COLD CALLING (20 chiamate)
// ========================================
function popolaColdCalling(ss) {
  const sheet = ss.getSheetByName('COLD CALLING');

  const nomi = ['Mario Rossi', 'Luca Bianchi', 'Giuseppe Verdi', 'Francesco Neri', 'Alessandro Russo',
    'Marco Ferrari', 'Andrea Esposito', 'Paolo Colombo', 'Carlo Ricci', 'Giovanni Marino',
    'Luigi Greco', 'Stefano Bruno', 'Roberto Gallo', 'Davide Conti', 'Simone De Luca',
    'Matteo Costa', 'Lorenzo Mancini', 'Riccardo Santoro', 'Filippo Mariani', 'Giorgio Caruso'];

  const chiamate = [];
  const oggi = new Date();

  for (let i = 0; i < 20; i++) {
    const data = new Date(oggi);
    data.setDate(oggi.getDate() - Math.floor(i / 4));

    const ora = `${9 + Math.floor(i % 4 * 0.5)}:${(i % 2) * 30}0`;
    const nome = nomi[i];
    const azienda = `Studio ${nome.split(' ')[1]}`;
    const tel = `081${Math.floor(Math.random() * 10000000)}`;
    const categoria = ['Commercialista', 'Avvocato', 'Odontoiatra'][Math.floor(Math.random() * 3)];
    const contatto = Math.random() > 0.3 ? 'SÌ' : 'NO';

    let esito, appFissato, dataApp, fatto, cliente, aum;

    if (contatto === 'SÌ') {
      const random = Math.random();
      if (random > 0.7) {
        esito = 'App fissato';
        appFissato = 'SÌ';
        dataApp = new Date(data);
        dataApp.setDate(dataApp.getDate() + Math.floor(Math.random() * 5) + 2);
        fatto = Math.random() > 0.2 ? 'SÌ' : 'NO';
        cliente = fatto === 'SÌ' && Math.random() > 0.7 ? 'SÌ' : 'NO';
        aum = cliente === 'SÌ' ? Math.floor(Math.random() * 150000) + 80000 : '';
      } else if (random > 0.4) {
        esito = 'Richiamare 2 settimane';
        appFissato = 'NO';
        dataApp = '';
        fatto = '';
        cliente = 'NO';
        aum = '';
      } else {
        esito = 'Non interessato';
        appFissato = 'NO';
        dataApp = '';
        fatto = '';
        cliente = 'NO';
        aum = '';
      }
    } else {
      esito = 'No risposta';
      appFissato = 'NO';
      dataApp = '';
      fatto = '';
      cliente = 'NO';
      aum = '';
    }

    chiamate.push([
      data,
      ora,
      nome.split(' ')[0],
      azienda,
      tel,
      categoria,
      contatto,
      esito,
      appFissato,
      dataApp,
      fatto,
      cliente,
      aum,
      cliente === 'SÌ' ? 'Ottimo cliente' : esito === 'App fissato' ? 'Molto interessato' : ''
    ]);
  }

  sheet.getRange(2, 1, chiamate.length, 14).setValues(chiamate);
}

// ========================================
// DATI ESEMPIO: PARTNERSHIP (3 partner)
// ========================================
function popolaPartnership(ss) {
  const sheet = ss.getSheetByName('PARTNERSHIP');

  const partner = [
    ['Dott. Luigi Verdi', 'Commercialista', 'Napoli', 'luigi.verdi@example.com', '0812345678', new Date(2024, 11, 15), 2, 5, 3, 360000, 'Attivo', 'Molto collaborativo, ottimi clienti'],
    ['Avv. Maria Rossi', 'Avvocato', 'Caserta', 'maria.rossi@example.com', '0823456789', new Date(2024, 11, 20), 1, 3, 2, 240000, 'Attivo', 'Specializzata in M&A, referral di qualità'],
    ['Dott. Paolo Bianchi', 'Consulente Lavoro', 'Salerno', 'paolo.bianchi@example.com', '0894567890', new Date(2025, 0, 5), 1, 2, 1, 120000, 'Tiepido', 'Nuovo partner, da coltivare']
  ];

  sheet.getRange(2, 1, partner.length, 12).setValues(partner);
}

// ========================================
// DATI ESEMPIO: TFR ENTRY (2 aziende)
// ========================================
function popolaTFREntry(ss) {
  const sheet = ss.getSheetByName('TFR ENTRY');

  const tfr = [
    ['Studio Commercialisti Bianchi', 'Servizi Professionali', 12, new Date(2025, 0, 3), new Date(2025, 0, 15), 7, '', 1, 40000, 'SÌ', 80000, 'SÌ', 200000, 0, '', 'Ottimo rapporto, clienti soddisfatti'],
    ['Dental Pro Srl', 'Odontoiatria', 8, new Date(2025, 0, 5), new Date(2025, 0, 18), 5, '', 1, 35000, 'NO', '', 'NO', '', 1, '', 'In attesa scala liquidità aziendale']
  ];

  sheet.getRange(2, 1, tfr.length, 16).setValues(tfr);
}

// ========================================
// DATI ESEMPIO: EVENTI LIBRO (1 evento)
// ========================================
function popolaEventiLibro(ss) {
  const sheet = ss.getSheetByName('EVENTI LIBRO');

  const eventi = [
    [1, new Date(2024, 11, 15), 'Libreria Feltrinelli Napoli', 'Patrimonio Imprenditoriale', 35, 15, 8, 6, 4, 480000]
  ];

  sheet.getRange(2, 1, eventi.length, 10).setValues(eventi);
}

// ========================================
// DATI ESEMPIO: PERCORSI FORMATIVI (1 percorso)
// ========================================
function popolaPercorsiFormativi(ss) {
  const sheet = ss.getSheetByName('PERCORSI FORMATIVI');

  const percorsi = [
    ['Dental Wealth System', 1, new Date(2025, 0, 8), 20, new Date(2025, 0, 8), new Date(2025, 0, 22), '', '', 12, 18, 11, 1320000, 'Prima edizione, ottima risposta']
  ];

  sheet.getRange(2, 1, percorsi.length, 13).setValues(percorsi);
}

// ========================================
// MENU CUSTOM
// ========================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🎯 Ecosistema Acquisizione')
    .addItem('🚀 Setup Completo', 'setupEcosistemaAcquisizione')
    .addSeparator()
    .addItem('📊 Aggiorna Dashboard', 'aggiornaDashboard')
    .addItem('🔄 Rigenera Dati Esempio', 'rigeneraDatiEsempio')
    .addSeparator()
    .addItem('📧 Esporta per Looker Studio', 'preparaPerLookerStudio')
    .addItem('ℹ️ Guida Utilizzo', 'mostraGuida')
    .addToUi();
}

function aggiornaDashboard() {
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('✅ Dashboard aggiornata con successo!');
}

function rigeneraDatiEsempio() {
  const result = SpreadsheetApp.getUi().alert(
    '⚠️ ATTENZIONE',
    'Questa operazione cancellerà tutti i dati esistenti e rigenererà i dati di esempio.\n\nContinuare?',
    SpreadsheetApp.getUi().ButtonSet.YES_NO
  );

  if (result == SpreadsheetApp.getUi().Button.YES) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    popolaDatiEsempio(ss);
    SpreadsheetApp.getUi().alert('✅ Dati esempio rigenerati!');
  }
}

function preparaPerLookerStudio() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const url = ss.getUrl();

  SpreadsheetApp.getUi().alert(
    '📊 PROSSIMO STEP: LOOKER STUDIO\n\n' +
    '1. Vai su: https://lookerstudio.google.com\n' +
    '2. Clicca "Crea" → "Report"\n' +
    '3. Seleziona "Fogli Google"\n' +
    '4. Connetti questo sheet:\n' + url + '\n\n' +
    '5. Seleziona i seguenti fogli:\n' +
    '   - DASHBOARD\n' +
    '   - FUNNEL GENERALE\n' +
    '   - PIPELINE\n' +
    '   - RISULTATI MENSILI\n\n' +
    'Poi crea i componenti visuali come indicato nelle istruzioni!'
  );
}

function mostraGuida() {
  SpreadsheetApp.getUi().alert(
    '📖 GUIDA RAPIDA UTILIZZO\n\n' +
    '🎯 DASHBOARD\n' +
    'Il tuo cruscotto principale. Aprilo ogni lunedì mattina.\n\n' +
    '👥 DATABASE CONTATTI\n' +
    'Inserisci qui tutti i tuoi 700 contatti (sostituisci i dati esempio).\n\n' +
    '💼 PIPELINE\n' +
    'Traccia ogni prospect dal primo contatto alla chiusura.\n' +
    'Aggiorna Stage e Next Action dopo ogni interazione.\n\n' +
    '📈 FUNNEL GENERALE\n' +
    'Compila ogni venerdì ore 17:00 i dati della settimana.\n\n' +
    '📧 ALTRI SHEET\n' +
    'Compila man mano: Newsletter, Cold Calling, Partnership, etc.\n\n' +
    '🔄 AGGIORNA DASHBOARD\n' +
    'Menu → Aggiorna Dashboard per forzare ricalcolo formule.\n\n' +
    'Per supporto: antonio@antoniotritto.com'
  );
}
