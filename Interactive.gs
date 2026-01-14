/**
 * ═══════════════════════════════════════════════════════════════════
 * FUNZIONI INTERATTIVE - Azioni dell'utente
 * ═══════════════════════════════════════════════════════════════════
 * Queste funzioni sono chiamate dal menu e permettono di gestire
 * il CRM in modo interattivo
 */

// ═══════════════════════════════════════════════════════════════════
// GESTIONE CHIAMATE
// ═══════════════════════════════════════════════════════════════════

function registraNuovaChiamata() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  // Richiedi informazioni chiamata
  const contatto = ui.prompt('Nome Contatto', 'Inserisci il nome del contatto chiamato:', ui.ButtonSet.OK_CANCEL);
  if (contatto.getSelectedButton() !== ui.Button.OK) return;

  const tel = ui.prompt('Telefono', 'Inserisci il numero di telefono:', ui.ButtonSet.OK_CANCEL);
  if (tel.getSelectedButton() !== ui.Button.OK) return;

  const esito = ui.prompt(
    'Esito Chiamata',
    'Scegli:\n1 = Interessato\n2 = Non Interessato\n3 = Richiamare\n4 = No Risposta\n5 = Appointment Fissato',
    ui.ButtonSet.OK_CANCEL
  );
  if (esito.getSelectedButton() !== ui.Button.OK) return;

  const esitoMap = {
    '1': 'Risposto - Interessato',
    '2': 'Risposto - Non Interessato',
    '3': 'Risposto - Richiamare',
    '4': 'No Risposta',
    '5': 'Appointment Fissato'
  };

  const esitoTesto = esitoMap[esito.getResponseText()] || 'Altro';

  const note = ui.prompt('Note', 'Inserisci note sulla chiamata:', ui.ButtonSet.OK_CANCEL);
  if (note.getSelectedButton() !== ui.Button.OK) return;

  // Registra nel foglio CHIAMATE & FOLLOW-UP
  const sheet = ss.getSheetByName('CHIAMATE & FOLLOW-UP');
  const ultimaRiga = sheet.getLastRow() + 1;

  const ora = new Date();
  const oraStr = Utilities.formatDate(ora, Session.getScriptTimeZone(), 'HH:mm');

  const dataFollowUp = new Date();
  dataFollowUp.setDate(dataFollowUp.getDate() + (esitoTesto.includes('Interessato') ? 3 : 14));

  sheet.getRange(ultimaRiga, 1, 1, 16).setValues([[
    '', // Call ID (auto)
    new Date(),
    oraStr,
    contatto.getResponseText(),
    tel.getResponseText(),
    '',
    'Cold Call',
    5,
    esitoTesto,
    'Buona',
    esitoTesto.includes('Interessato') ? 'Alto' : 'Medio',
    'Follow-up programmato',
    dataFollowUp,
    'Da Fare',
    note.getResponseText(),
    Session.getActiveUser().getEmail()
  ]]);

  // Registra anche in TIMELINE INTERAZIONI
  const timelineSheet = ss.getSheetByName('TIMELINE INTERAZIONI');
  const ultimaRigaTimeline = timelineSheet.getLastRow() + 1;

  timelineSheet.getRange(ultimaRigaTimeline, 1, 1, 16).setValues([[
    ora,
    new Date(),
    oraStr,
    contatto.getResponseText(),
    '',
    'Telefonata',
    'Telefono',
    '5 min',
    'Lead',
    esitoTesto.includes('Interessato') ? 'Contatto' : 'Lead',
    esitoTesto.includes('Interessato') ? 'SÌ' : 'NO',
    esitoTesto.includes('Interessato') ? 'Positivo' : 'Neutrale',
    'Chiamata effettuata',
    '',
    note.getResponseText(),
    Session.getActiveUser().getEmail()
  ]]);

  ui.alert('✅ Chiamata registrata con successo!\n\nFollow-up programmato per: ' +
           Utilities.formatDate(dataFollowUp, Session.getScriptTimeZone(), 'dd/MM/yyyy'));
}

function mostraChiamateDaFareOggi() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('CHIAMATE & FOLLOW-UP');
  const ui = SpreadsheetApp.getUi();

  const data = sheet.getDataRange().getValues();
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  let chiamateDaFare = [];

  for (let i = 1; i < data.length; i++) {
    const dataFollowUp = new Date(data[i][12]); // Colonna M
    dataFollowUp.setHours(0, 0, 0, 0);
    const stato = data[i][13]; // Colonna N

    if (dataFollowUp.getTime() === oggi.getTime() && stato !== 'Completato') {
      chiamateDaFare.push(`• ${data[i][3]} - ${data[i][4]} - ${data[i][11]}`);
    }
  }

  if (chiamateDaFare.length === 0) {
    ui.alert('✅ Nessuna chiamata da fare oggi!');
  } else {
    ui.alert(
      `📞 CHIAMATE DA FARE OGGI (${chiamateDaFare.length}):\n\n` +
      chiamateDaFare.join('\n')
    );
  }
}

function impostaReminderChiamata() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    '🔔 REMINDER CHIAMATE',
    'Per impostare reminder automatici:\n\n' +
    '1. Vai su CRM → Automazioni → Attiva Tutti i Trigger\n' +
    '2. Riceverai una email ogni mattina con le chiamate da fare\n\n' +
    'Oppure usa questa funzione per vedere le chiamate da fare oggi.',
    ui.ButtonSet.OK
  );
}

// ═══════════════════════════════════════════════════════════════════
// GESTIONE PIPELINE
// ═══════════════════════════════════════════════════════════════════

function visualizzaPipelineGrafica() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pipelineSheet = ss.getSheetByName('PIPELINE');

  // Attiva il foglio e imposta i filtri
  ss.setActiveSheet(pipelineSheet);

  SpreadsheetApp.getUi().alert(
    '👁️ VISUALIZZA PIPELINE',
    'Sei ora nel foglio PIPELINE.\n\n' +
    'Puoi:\n' +
    '• Filtrare per Stage, Fonte, Categoria\n' +
    '• Ordinare per Giorni in Stage, AUM, Data\n' +
    '• Vedere il riepilogo in fondo al foglio\n\n' +
    'Le righe rosse sono deal in stallo (>14 giorni).',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function avanzaProspectStage() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const pipelineId = ui.prompt(
    'Avanza Prospect',
    'Inserisci il Pipeline ID del prospect (es: P-0001):',
    ui.ButtonSet.OK_CANCEL
  );

  if (pipelineId.getSelectedButton() !== ui.Button.OK) return;

  const sheet = ss.getSheetByName('PIPELINE');
  const data = sheet.getDataRange().getValues();

  let rigaTrovata = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === pipelineId.getResponseText()) {
      rigaTrovata = i;
      break;
    }
  }

  if (rigaTrovata === -1) {
    ui.alert('❌ Pipeline ID non trovato!');
    return;
  }

  const stageAttuale = data[rigaTrovata][7]; // Colonna H
  const stages = ['Lead', 'Contatto', 'Qualificato', 'Proposta Inviata', 'Negoziazione', 'Contratto Inviato', 'Contratto Firmato', 'Cliente Attivo'];

  const indiceAttuale = stages.indexOf(stageAttuale);
  if (indiceAttuale === -1 || indiceAttuale >= stages.length - 1) {
    ui.alert('❌ Questo prospect è già al massimo stage!');
    return;
  }

  const nuovoStage = stages[indiceAttuale + 1];

  const conferma = ui.alert(
    'Conferma Avanzamento',
    `Avanzare ${data[rigaTrovata][1]} da "${stageAttuale}" a "${nuovoStage}"?`,
    ui.ButtonSet.YES_NO
  );

  if (conferma !== ui.Button.YES) return;

  // Aggiorna lo stage
  sheet.getRange(rigaTrovata + 1, 8).setValue(nuovoStage);
  sheet.getRange(rigaTrovata + 1, 7).setValue(new Date()); // Aggiorna data ingresso stage
  sheet.getRange(rigaTrovata + 1, 13).setValue(new Date()); // Aggiorna ultima interazione

  // Registra in timeline
  const timelineSheet = ss.getSheetByName('TIMELINE INTERAZIONI');
  const ultimaRiga = timelineSheet.getLastRow() + 1;

  timelineSheet.getRange(ultimaRiga, 1, 1, 16).setValues([[
    new Date(),
    new Date(),
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm'),
    data[rigaTrovata][1],
    pipelineId.getResponseText(),
    'Avanzamento Pipeline',
    'Sistema',
    '',
    stageAttuale,
    nuovoStage,
    'SÌ',
    'Positivo',
    `Avanzamento da ${stageAttuale} a ${nuovoStage}`,
    '',
    'Stage avanzato nel sistema',
    Session.getActiveUser().getEmail()
  ]]);

  ui.alert(`✅ Prospect avanzato con successo a "${nuovoStage}"!`);
}

function chiudiDeal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const pipelineId = ui.prompt(
    'Chiudi Deal',
    'Inserisci il Pipeline ID (es: P-0001):',
    ui.ButtonSet.OK_CANCEL
  );

  if (pipelineId.getSelectedButton() !== ui.Button.OK) return;

  const esito = ui.alert(
    'Esito Deal',
    'Il deal è stato:\n\n' +
    'SÌ = Vinto (nuovo cliente)\n' +
    'NO = Perso',
    ui.ButtonSet.YES_NO_CANCEL
  );

  if (esito === ui.Button.CANCEL) return;

  const sheet = ss.getSheetByName('PIPELINE');
  const data = sheet.getDataRange().getValues();

  let rigaTrovata = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === pipelineId.getResponseText()) {
      rigaTrovata = i;
      break;
    }
  }

  if (rigaTrovata === -1) {
    ui.alert('❌ Pipeline ID non trovato!');
    return;
  }

  if (esito === ui.Button.YES) {
    // Deal VINTO
    const aum = ui.prompt(
      'AUM Cliente',
      'Inserisci l\'AUM acquisito (in €):',
      ui.ButtonSet.OK_CANCEL
    );

    if (aum.getSelectedButton() !== ui.Button.OK) return;

    // Aggiorna Pipeline
    sheet.getRange(rigaTrovata + 1, 8).setValue('Cliente Attivo');
    sheet.getRange(rigaTrovata + 1, 18).setValue(new Date()); // Data chiusura
    sheet.getRange(rigaTrovata + 1, 6).setValue(parseFloat(aum.getResponseText())); // AUM

    // Aggiorna Database Contatti
    const dbSheet = ss.getSheetByName('DATABASE CONTATTI');
    const dbData = dbSheet.getDataRange().getValues();

    for (let i = 1; i < dbData.length; i++) {
      if (dbData[i][15] === pipelineId.getResponseText()) { // Pipeline ID
        dbSheet.getRange(i + 1, 14).setValue('SÌ'); // Cliente?
        dbSheet.getRange(i + 1, 15).setValue(parseFloat(aum.getResponseText())); // AUM
        dbSheet.getRange(i + 1, 16).setValue(''); // Rimuovi Pipeline ID
        break;
      }
    }

    // Registra AUM
    const aumSheet = ss.getSheetByName('REGISTRO AUM');
    const ultimaRigaAUM = aumSheet.getLastRow() + 1;

    aumSheet.getRange(ultimaRigaAUM, 1, 1, 14).setValues([[
      '',
      new Date(),
      data[rigaTrovata][1], // Cliente
      pipelineId.getResponseText(),
      '',
      'Nuova Acquisizione',
      0,
      parseFloat(aum.getResponseText()),
      '',
      'Nuovo cliente acquisito',
      '',
      parseFloat(aum.getResponseText()),
      'Deal chiuso vinto',
      Session.getActiveUser().getEmail()
    ]]);

    ui.alert(`🎉 CONGRATULAZIONI!\n\nDeal chiuso con successo!\n\nAUM acquisito: €${aum.getResponseText()}`);

  } else {
    // Deal PERSO
    const motivo = ui.prompt(
      'Motivo Perdita',
      'Perché il deal è stato perso?',
      ui.ButtonSet.OK_CANCEL
    );

    if (motivo.getSelectedButton() !== ui.Button.OK) return;

    sheet.getRange(rigaTrovata + 1, 8).setValue('Chiuso Perso');
    sheet.getRange(rigaTrovata + 1, 18).setValue(new Date());
    sheet.getRange(rigaTrovata + 1, 19).setValue(motivo.getResponseText());

    ui.alert('Deal chiuso come perso. Motivo registrato.');
  }
}

function trovaDealInStallo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PIPELINE');
  const ui = SpreadsheetApp.getUi();

  const data = sheet.getDataRange().getValues();
  let dealInStallo = [];

  for (let i = 1; i < data.length; i++) {
    const giorni = data[i][9]; // Colonna J - Giorni in Stage
    const stage = data[i][7];

    if (giorni > CONFIG.SOGLIA_PIPELINE_STALLO && stage !== 'Cliente Attivo' && stage !== 'Chiuso Perso') {
      dealInStallo.push({
        id: data[i][0],
        prospect: data[i][1],
        giorni: giorni,
        stage: stage,
        nextAction: data[i][10]
      });
    }
  }

  if (dealInStallo.length === 0) {
    ui.alert('✅ Nessun deal in stallo! Ottimo lavoro!');
    return;
  }

  let messaggio = `🚨 TROVATI ${dealInStallo.length} DEAL IN STALLO (>${CONFIG.SOGLIA_PIPELINE_STALLO} giorni):\n\n`;

  dealInStallo.forEach(deal => {
    messaggio += `• ${deal.id} - ${deal.prospect}\n`;
    messaggio += `  Stage: ${deal.stage} (da ${deal.giorni} giorni)\n`;
    messaggio += `  Next: ${deal.nextAction}\n\n`;
  });

  ui.alert(messaggio);
}

// ═══════════════════════════════════════════════════════════════════
// GESTIONE CONTRATTI
// ═══════════════════════════════════════════════════════════════════

function creaNuovoContratto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const pipelineId = ui.prompt('Pipeline ID', 'Inserisci il Pipeline ID:', ui.ButtonSet.OK_CANCEL);
  if (pipelineId.getSelectedButton() !== ui.Button.OK) return;

  const aum = ui.prompt('AUM', 'Inserisci l\'AUM del contratto (€):', ui.ButtonSet.OK_CANCEL);
  if (aum.getSelectedButton() !== ui.Button.OK) return;

  const tipo = ui.prompt(
    'Tipo Contratto',
    'Scegli:\n1=Gestione Patrimonio\n2=Consulenza\n3=TFR\n4=Piano Pensionistico',
    ui.ButtonSet.OK_CANCEL
  );
  if (tipo.getSelectedButton() !== ui.Button.OK) return;

  const tipoMap = {
    '1': 'Gestione Patrimonio',
    '2': 'Consulenza Finanziaria',
    '3': 'TFR Aziendale',
    '4': 'Piano Pensionistico'
  };

  // Trova cliente dalla pipeline
  const pipelineSheet = ss.getSheetByName('PIPELINE');
  const pipelineData = pipelineSheet.getDataRange().getValues();
  let cliente = '';

  for (let i = 1; i < pipelineData.length; i++) {
    if (pipelineData[i][0] === pipelineId.getResponseText()) {
      cliente = pipelineData[i][1];
      break;
    }
  }

  if (!cliente) {
    ui.alert('❌ Pipeline ID non trovato!');
    return;
  }

  // Crea contratto
  const contrattiSheet = ss.getSheetByName('GESTIONE CONTRATTI');
  const ultimaRiga = contrattiSheet.getLastRow() + 1;

  contrattiSheet.getRange(ultimaRiga, 1, 1, 19).setValues([[
    '', // Contratto ID (auto)
    pipelineId.getResponseText(),
    cliente,
    tipoMap[tipo.getResponseText()] || 'Gestione Patrimonio',
    parseFloat(aum.getResponseText()),
    new Date(),
    '',
    '',
    '',
    'Bozza',
    0.005, // Fee 0.5%
    '',
    3, // Durata 3 anni
    '',
    'SÌ', // Rinnovo auto
    '',
    'NO',
    '',
    'Contratto creato dal sistema'
  ]]);

  ui.alert(`✅ Contratto creato con successo!\n\nCliente: ${cliente}\nAUM: €${aum.getResponseText()}`);
}

function inviaContratto() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    '📨 INVIO CONTRATTO',
    'Per inviare il contratto:\n\n' +
    '1. Vai nel foglio GESTIONE CONTRATTI\n' +
    '2. Trova il contratto da inviare\n' +
    '3. Aggiorna:\n' +
    '   - Data Invio = oggi\n' +
    '   - Stato = "Inviato"\n' +
    '   - Email Inviata? = "SÌ"\n\n' +
    'Poi invia effettivamente il contratto via email al cliente.',
    ui.ButtonSet.OK
  );
}

function registraFirmaContratto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const contrattoId = ui.prompt(
    'Firma Contratto',
    'Inserisci il Contratto ID (es: CTR-2025-001):',
    ui.ButtonSet.OK_CANCEL
  );

  if (contrattoId.getSelectedButton() !== ui.Button.OK) return;

  const sheet = ss.getSheetByName('GESTIONE CONTRATTI');
  const data = sheet.getDataRange().getValues();

  let rigaTrovata = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === contrattoId.getResponseText()) {
      rigaTrovata = i;
      break;
    }
  }

  if (rigaTrovata === -1) {
    ui.alert('❌ Contratto ID non trovato!');
    return;
  }

  // Aggiorna contratto
  sheet.getRange(rigaTrovata + 1, 8).setValue(new Date()); // Data Firma
  sheet.getRange(rigaTrovata + 1, 9).setValue(new Date()); // Data Attivazione
  sheet.getRange(rigaTrovata + 1, 10).setValue('Attivo');
  sheet.getRange(rigaTrovata + 1, 18).setValue(data[rigaTrovata][2]); // Firmato Da = Cliente

  ui.alert(`✅ Contratto firmato e attivato!\n\nCliente: ${data[rigaTrovata][2]}\nAUM: €${data[rigaTrovata][4]}`);
}

function reportContrattiPendenti() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('GESTIONE CONTRATTI');
  const ui = SpreadsheetApp.getUi();

  const data = sheet.getDataRange().getValues();
  let contratti = {
    inviati: [],
    revisione: [],
    approvati: []
  };

  for (let i = 1; i < data.length; i++) {
    const stato = data[i][9];
    const info = `• ${data[i][0]} - ${data[i][2]} - €${data[i][4]}`;

    if (stato === 'Inviato') contratti.inviati.push(info);
    else if (stato === 'In Revisione') contratti.revisione.push(info);
    else if (stato === 'Approvato') contratti.approvati.push(info);
  }

  let messaggio = '📊 REPORT CONTRATTI PENDENTI\n\n';

  messaggio += `✉️  INVIATI (${contratti.inviati.length}):\n`;
  if (contratti.inviati.length > 0) {
    messaggio += contratti.inviati.join('\n') + '\n\n';
  } else {
    messaggio += 'Nessuno\n\n';
  }

  messaggio += `🔍 IN REVISIONE (${contratti.revisione.length}):\n`;
  if (contratti.revisione.length > 0) {
    messaggio += contratti.revisione.join('\n') + '\n\n';
  } else {
    messaggio += 'Nessuno\n\n';
  }

  messaggio += `✅ APPROVATI (${contratti.approvati.length}):\n`;
  if (contratti.approvati.length > 0) {
    messaggio += contratti.approvati.join('\n');
  } else {
    messaggio += 'Nessuno';
  }

  ui.alert(messaggio);
}

// ═══════════════════════════════════════════════════════════════════
// GESTIONE AUM
// ═══════════════════════════════════════════════════════════════════

function registraNuovoAUM() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const cliente = ui.prompt('Cliente', 'Nome del cliente:', ui.ButtonSet.OK_CANCEL);
  if (cliente.getSelectedButton() !== ui.Button.OK) return;

  const tipo = ui.prompt(
    'Tipo Operazione',
    '1=Nuova Acquisizione\n2=Versamento\n3=Prelievo\n4=Performance',
    ui.ButtonSet.OK_CANCEL
  );
  if (tipo.getSelectedButton() !== ui.Button.OK) return;

  const importo = ui.prompt('Importo', 'Importo in €:', ui.ButtonSet.OK_CANCEL);
  if (importo.getSelectedButton() !== ui.Button.OK) return;

  const tipoMap = {
    '1': 'Nuova Acquisizione',
    '2': 'Versamento Aggiuntivo',
    '3': 'Prelievo Parziale',
    '4': 'Performance Positiva'
  };

  const sheet = ss.getSheetByName('REGISTRO AUM');
  const ultimaRiga = sheet.getLastRow() + 1;

  sheet.getRange(ultimaRiga, 1, 1, 14).setValues([[
    '',
    new Date(),
    cliente.getResponseText(),
    '',
    '',
    tipoMap[tipo.getResponseText()],
    0,
    parseFloat(importo.getResponseText()),
    '',
    'Registrazione manuale',
    '',
    parseFloat(importo.getResponseText()),
    'AUM registrato dal sistema',
    Session.getActiveUser().getEmail()
  ]]);

  ui.alert(`✅ AUM registrato!\n\nCliente: ${cliente.getResponseText()}\nImporto: €${importo.getResponseText()}`);
}

function aggiornaAUMCliente() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    '📈 AGGIORNA AUM CLIENTE',
    'Per aggiornare l\'AUM di un cliente:\n\n' +
    '1. Usa "Registra Nuovo AUM"\n' +
    '2. Seleziona tipo: Versamento/Prelievo/Performance\n' +
    '3. Il sistema calcolerà automaticamente il nuovo AUM',
    ui.ButtonSet.OK
  );
}

function generaReportAUMMensile() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('REGISTRO AUM');
  const ui = SpreadsheetApp.getUi();

  ui.alert(
    '📊 REPORT AUM MENSILE',
    'Vai nel foglio REGISTRO AUM per vedere il report.\n\n' +
    'In fondo al foglio trovi i summary con:\n' +
    '• AUM Totale Attuale\n' +
    '• Nuove Acquisizioni del mese\n' +
    '• Versamenti del mese\n' +
    '• Prelievi del mese\n' +
    '• Performance del mese\n' +
    '• Numero Clienti Attivi',
    ui.ButtonSet.OK
  );

  ss.setActiveSheet(sheet);
  sheet.getRange('A10003').activate();
}

// Continua...
