/**
 * ═══════════════════════════════════════════════════════════════════
 * AUTOMAZIONI E GRAFICI
 * ═══════════════════════════════════════════════════════════════════
 * Trigger automatici e visualizzazioni grafiche
 */

// ═══════════════════════════════════════════════════════════════════
// GESTIONE TRIGGER
// ═══════════════════════════════════════════════════════════════════

function attivaAutomazioni() {
  const ui = SpreadsheetApp.getUi();

  try {
    // Rimuovi trigger esistenti
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

    // Crea nuovi trigger
    ScriptApp.newTrigger('inviaReportGiornalieroAutomatico')
      .timeBased()
      .everyDays(1)
      .atHour(8)
      .create();

    ScriptApp.newTrigger('inviaReportSettimanale')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(9)
      .create();

    ScriptApp.newTrigger('controllaDealInStallo')
      .timeBased()
      .everyDays(1)
      .atHour(10)
      .create();

    ScriptApp.newTrigger('controllaContrattiScadenza')
      .timeBased()
      .everyDays(1)
      .atHour(11)
      .create();

    ui.alert(
      '✅ AUTOMAZIONI ATTIVATE!\n\n' +
      'Trigger programmati:\n\n' +
      '📧 Report Giornaliero: ogni giorno ore 8:00\n' +
      '📊 Report Settimanale: ogni lunedì ore 9:00\n' +
      '⚠️ Check Deal in Stallo: ogni giorno ore 10:00\n' +
      '📄 Check Contratti: ogni giorno ore 11:00\n\n' +
      'Riceverai email a: ' + CONFIG.EMAIL_NOTIFICHE
    );

  } catch (error) {
    ui.alert('❌ ERRORE nell\'attivazione automazioni:\n\n' + error);
  }
}

function disattivaAutomazioni() {
  const ui = SpreadsheetApp.getUi();

  const conferma = ui.alert(
    '⚠️ DISATTIVA AUTOMAZIONI',
    'Sei sicuro di voler disattivare tutti i trigger automatici?',
    ui.ButtonSet.YES_NO
  );

  if (conferma !== ui.Button.YES) return;

  try {
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

    ui.alert('✅ Tutte le automazioni sono state disattivate.');
  } catch (error) {
    ui.alert('❌ ERRORE nella disattivazione:\n\n' + error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// FUNZIONI AUTOMATICHE (chiamate dai trigger)
// ═══════════════════════════════════════════════════════════════════

function inviaReportGiornalieroAutomatico() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Raccogli dati
    const chiamateDaFare = contaChiamateDaFare(ss);
    const dealInStallo = contaDealInStallo(ss);
    const contrattiPendenti = contaContrattiPendenti(ss);
    const followUpScaduti = contaFollowUpScaduti(ss);

    // Crea messaggio
    let messaggio = '<h2>🎯 Report Giornaliero CRM</h2>';
    messaggio += '<p><strong>Data: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy') + '</strong></p>';

    messaggio += '<h3>📞 Azioni di Oggi:</h3><ul>';
    messaggio += '<li>Chiamate da fare: <strong>' + chiamateDaFare + '</strong></li>';
    messaggio += '<li>Follow-up scaduti: <strong>' + followUpScaduti + '</strong></li>';
    messaggio += '</ul>';

    messaggio += '<h3>⚠️ Alert:</h3><ul>';
    messaggio += '<li>Deal in stallo (>14gg): <strong>' + dealInStallo + '</strong></li>';
    messaggio += '<li>Contratti pendenti: <strong>' + contrattiPendenti + '</strong></li>';
    messaggio += '</ul>';

    messaggio += '<p><a href="' + ss.getUrl() + '">Vai al CRM</a></p>';

    // Invia email
    MailApp.sendEmail({
      to: CONFIG.EMAIL_NOTIFICHE,
      subject: '🎯 Report CRM Giornaliero - ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy'),
      htmlBody: messaggio
    });

    Logger.log('Report giornaliero inviato con successo');
  } catch (error) {
    Logger.log('Errore invio report giornaliero: ' + error);
  }
}

function inviaReportSettimanale() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Raccogli metriche settimanali
    const metriche = calcolaMetricheSettimanali(ss);

    let messaggio = '<h2>📊 Report Settimanale CRM</h2>';
    messaggio += '<p><strong>Settimana: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy') + '</strong></p>';

    messaggio += '<h3>📈 Performance:</h3><ul>';
    messaggio += '<li>Chiamate effettuate: <strong>' + metriche.chiamate + '</strong></li>';
    messaggio += '<li>Meeting tenuti: <strong>' + metriche.meeting + '</strong></li>';
    messaggio += '<li>Nuovi contatti: <strong>' + metriche.nuoviContatti + '</strong></li>';
    messaggio += '<li>Deal chiusi: <strong>' + metriche.dealChiusi + '</strong></li>';
    messaggio += '<li>AUM acquisito: <strong>€' + Number(metriche.aumAcquisito).toLocaleString() + '</strong></li>';
    messaggio += '</ul>';

    messaggio += '<h3>🎯 Pipeline:</h3><ul>';
    messaggio += '<li>Deal attivi: <strong>' + metriche.dealAttivi + '</strong></li>';
    messaggio += '<li>Valore pipeline: <strong>€' + Number(metriche.valorePipeline).toLocaleString() + '</strong></li>';
    messaggio += '</ul>';

    messaggio += '<p><a href="' + ss.getUrl() + '">Vai al CRM</a></p>';

    MailApp.sendEmail({
      to: CONFIG.EMAIL_NOTIFICHE,
      subject: '📊 Report CRM Settimanale - Settimana ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'w/yyyy'),
      htmlBody: messaggio
    });

    Logger.log('Report settimanale inviato con successo');
  } catch (error) {
    Logger.log('Errore invio report settimanale: ' + error);
  }
}

function controllaDealInStallo() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PIPELINE');
    const data = sheet.getDataRange().getValues();

    let dealInStallo = [];

    for (let i = 1; i < data.length; i++) {
      const giorni = data[i][9];
      const stage = data[i][7];

      if (giorni > CONFIG.SOGLIA_PIPELINE_STALLO && stage !== 'Cliente Attivo' && stage !== 'Chiuso Perso') {
        dealInStallo.push({
          id: data[i][0],
          prospect: data[i][1],
          giorni: giorni,
          stage: stage,
          aum: data[i][5]
        });
      }
    }

    if (dealInStallo.length > 0) {
      let messaggio = '<h2>🚨 Alert: Deal in Stallo</h2>';
      messaggio += '<p>Sono stati trovati <strong>' + dealInStallo.length + '</strong> deal fermi da più di ' + CONFIG.SOGLIA_PIPELINE_STALLO + ' giorni:</p>';
      messaggio += '<ul>';

      dealInStallo.forEach(deal => {
        messaggio += '<li><strong>' + deal.id + '</strong> - ' + deal.prospect;
        messaggio += '<br>Stage: ' + deal.stage + ' (da ' + deal.giorni + ' giorni)';
        messaggio += '<br>AUM Stimato: €' + Number(deal.aum).toLocaleString() + '</li>';
      });

      messaggio += '</ul>';
      messaggio += '<p><strong>⚡ Azione richiesta:</strong> Riattiva questi deal!</p>';
      messaggio += '<p><a href="' + ss.getUrl() + '">Vai al CRM</a></p>';

      MailApp.sendEmail({
        to: CONFIG.EMAIL_NOTIFICHE,
        subject: '🚨 Alert CRM: ' + dealInStallo.length + ' Deal in Stallo',
        htmlBody: messaggio
      });

      Logger.log('Alert deal in stallo inviato: ' + dealInStallo.length + ' deal');
    }
  } catch (error) {
    Logger.log('Errore controllo deal in stallo: ' + error);
  }
}

function controllaContrattiScadenza() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('GESTIONE CONTRATTI');
    const data = sheet.getDataRange().getValues();

    const oggi = new Date();
    const limite = new Date(oggi.getTime() + 60 * 24 * 60 * 60 * 1000); // +60 giorni

    let contrattiScadenza = [];

    for (let i = 1; i < data.length; i++) {
      const dataScadenza = new Date(data[i][13]); // Colonna N
      const stato = data[i][9];

      if (stato === 'Attivo' && dataScadenza <= limite && dataScadenza >= oggi) {
        const giorniMancanti = Math.floor((dataScadenza - oggi) / (1000 * 60 * 60 * 24));
        contrattiScadenza.push({
          id: data[i][0],
          cliente: data[i][2],
          aum: data[i][4],
          dataScadenza: dataScadenza,
          giorniMancanti: giorniMancanti,
          rinnovoAuto: data[i][14]
        });
      }
    }

    if (contrattiScadenza.length > 0) {
      let messaggio = '<h2>📄 Alert: Contratti in Scadenza</h2>';
      messaggio += '<p>Sono stati trovati <strong>' + contrattiScadenza.length + '</strong> contratti in scadenza nei prossimi 60 giorni:</p>';
      messaggio += '<ul>';

      contrattiScadenza.forEach(contratto => {
        messaggio += '<li><strong>' + contratto.id + '</strong> - ' + contratto.cliente;
        messaggio += '<br>Scade tra: <strong>' + contratto.giorniMancanti + ' giorni</strong>';
        messaggio += '<br>AUM: €' + Number(contratto.aum).toLocaleString();
        messaggio += '<br>Rinnovo Auto: ' + contratto.rinnovoAuto + '</li>';
      });

      messaggio += '</ul>';
      messaggio += '<p><strong>⚡ Azione richiesta:</strong> Contatta i clienti per il rinnovo!</p>';
      messaggio += '<p><a href="' + ss.getUrl() + '">Vai al CRM</a></p>';

      MailApp.sendEmail({
        to: CONFIG.EMAIL_NOTIFICHE,
        subject: '📄 Alert CRM: ' + contrattiScadenza.length + ' Contratti in Scadenza',
        htmlBody: messaggio
      });

      Logger.log('Alert contratti in scadenza inviato: ' + contrattiScadenza.length + ' contratti');
    }
  } catch (error) {
    Logger.log('Errore controllo contratti: ' + error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// FUNZIONI DI SUPPORTO
// ═══════════════════════════════════════════════════════════════════

function contaChiamateDaFare(ss) {
  const sheet = ss.getSheetByName('CHIAMATE & FOLLOW-UP');
  const data = sheet.getDataRange().getValues();
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const dataFollowUp = new Date(data[i][12]);
    dataFollowUp.setHours(0, 0, 0, 0);
    if (dataFollowUp.getTime() === oggi.getTime() && data[i][13] !== 'Completato') {
      count++;
    }
  }
  return count;
}

function contaDealInStallo(ss) {
  const sheet = ss.getSheetByName('PIPELINE');
  const data = sheet.getDataRange().getValues();

  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const giorni = data[i][9];
    const stage = data[i][7];
    if (giorni > CONFIG.SOGLIA_PIPELINE_STALLO && stage !== 'Cliente Attivo' && stage !== 'Chiuso Perso') {
      count++;
    }
  }
  return count;
}

function contaContrattiPendenti(ss) {
  const sheet = ss.getSheetByName('GESTIONE CONTRATTI');
  const data = sheet.getDataRange().getValues();

  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const stato = data[i][9];
    if (stato === 'Inviato' || stato === 'In Revisione' || stato === 'Approvato') {
      count++;
    }
  }
  return count;
}

function contaFollowUpScaduti(ss) {
  const sheet = ss.getSheetByName('CHIAMATE & FOLLOW-UP');
  const data = sheet.getDataRange().getValues();
  const oggi = new Date();

  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const dataFollowUp = new Date(data[i][12]);
    if (dataFollowUp < oggi && data[i][13] !== 'Completato') {
      count++;
    }
  }
  return count;
}

function calcolaMetricheSettimanali(ss) {
  const oggi = new Date();
  const inizioSettimana = new Date(oggi);
  inizioSettimana.setDate(oggi.getDate() - oggi.getDay() + 1);

  const chiamateSheet = ss.getSheetByName('CHIAMATE & FOLLOW-UP');
  const chiamateData = chiamateSheet.getDataRange().getValues();
  let chiamate = 0;
  for (let i = 1; i < chiamateData.length; i++) {
    const dataChiamata = new Date(chiamateData[i][1]);
    if (dataChiamata >= inizioSettimana) chiamate++;
  }

  const timelineSheet = ss.getSheetByName('TIMELINE INTERAZIONI');
  const timelineData = timelineSheet.getDataRange().getValues();
  let meeting = 0;
  for (let i = 1; i < timelineData.length; i++) {
    const data = new Date(timelineData[i][1]);
    if (data >= inizioSettimana && timelineData[i][5] === 'Meeting') meeting++;
  }

  const dbSheet = ss.getSheetByName('DATABASE CONTATTI');
  const dbData = dbSheet.getDataRange().getValues();
  let nuoviContatti = 0;
  for (let i = 1; i < dbData.length; i++) {
    const data = new Date(dbData[i][10]);
    if (data >= inizioSettimana) nuoviContatti++;
  }

  const pipelineSheet = ss.getSheetByName('PIPELINE');
  const pipelineData = pipelineSheet.getDataRange().getValues();
  let dealChiusi = 0;
  let dealAttivi = 0;
  let valorePipeline = 0;
  for (let i = 1; i < pipelineData.length; i++) {
    const dataChiusura = new Date(pipelineData[i][17]);
    if (pipelineData[i][7] === 'Cliente Attivo' && dataChiusura >= inizioSettimana) {
      dealChiusi++;
    }
    if (pipelineData[i][7] !== 'Cliente Attivo' && pipelineData[i][7] !== 'Chiuso Perso') {
      dealAttivi++;
      valorePipeline += pipelineData[i][5] || 0;
    }
  }

  const aumSheet = ss.getSheetByName('REGISTRO AUM');
  const aumData = aumSheet.getDataRange().getValues();
  let aumAcquisito = 0;
  for (let i = 1; i < aumData.length; i++) {
    const data = new Date(aumData[i][1]);
    if (data >= inizioSettimana && aumData[i][5] === 'Nuova Acquisizione') {
      aumAcquisito += aumData[i][7] || 0;
    }
  }

  return {
    chiamate: chiamate,
    meeting: meeting,
    nuoviContatti: nuoviContatti,
    dealChiusi: dealChiusi,
    aumAcquisito: aumAcquisito,
    dealAttivi: dealAttivi,
    valorePipeline: valorePipeline
  };
}

// ═══════════════════════════════════════════════════════════════════
// CREAZIONE GRAFICI PIPELINE
// ═══════════════════════════════════════════════════════════════════

function creaGraficiPipeline(ss) {
  try {
    const dashboardSheet = ss.getSheetByName('DASHBOARD');
    const pipelineSheet = ss.getSheetByName('PIPELINE');

    // Rimuovi grafici esistenti
    const charts = dashboardSheet.getCharts();
    charts.forEach(chart => dashboardSheet.removeChart(chart));

    // GRAFICO 1: Pipeline per Stage (Funnel Chart)
    const chartFunnel = dashboardSheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(dashboardSheet.getRange('G6:G11')) // Stage
      .addRange(dashboardSheet.getRange('H6:H11')) // Numero
      .setPosition(43, 1, 0, 0)
      .setOption('title', 'Pipeline per Stage')
      .setOption('width', 600)
      .setOption('height', 300)
      .setOption('legend', { position: 'none' })
      .setOption('colors', ['#38761D'])
      .build();

    dashboardSheet.insertChart(chartFunnel);

    // GRAFICO 2: Valore Pipeline per Stage
    const chartValore = dashboardSheet.newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(dashboardSheet.getRange('G6:G11'))
      .addRange(dashboardSheet.getRange('I6:I11'))
      .setPosition(43, 7, 0, 0)
      .setOption('title', 'Valore Pipeline (€)')
      .setOption('width', 500)
      .setOption('height', 300)
      .setOption('legend', { position: 'none' })
      .setOption('colors', ['#1155CC'])
      .build();

    dashboardSheet.insertChart(chartValore);

    Logger.log('Grafici creati con successo');
  } catch (error) {
    Logger.log('Errore creazione grafici: ' + error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// FUNZIONI UTILITÀ
// ═══════════════════════════════════════════════════════════════════

function aggiornaDashboardCompleto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast('Dashboard aggiornato!', '✅ Successo', 3);
}

function rigeneraDatiEsempio() {
  const ui = SpreadsheetApp.getUi();

  const result = ui.alert(
    '⚠️ ATTENZIONE',
    'Questa operazione:\n' +
    '• Cancellerà TUTTI i dati esistenti\n' +
    '• Rigenererà i dati di esempio\n\n' +
    'Sei SICURO di voler continuare?',
    ui.ButtonSet.YES_NO
  );

  if (result !== ui.Button.YES) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    ui.alert('⏳ Rigenerazione in corso... Attendere 30 secondi');

    popolaDatiEsempioCompleti(ss);

    SpreadsheetApp.flush();

    ui.alert('✅ Dati esempio rigenerati con successo!');
  } catch (error) {
    ui.alert('❌ ERRORE durante la rigenerazione:\n\n' + error);
  }
}

function mostraGuidaCompleta() {
  const ui = SpreadsheetApp.getUi();

  ui.alert(
    '📖 GUIDA COMPLETA CRM',
    '═══════════════════════════════════════\n' +
    '🎯 PANORAMICA\n' +
    '═══════════════════════════════════════\n\n' +
    'Questo CRM completo ti permette di gestire:\n' +
    '• Contatti e Prospect\n' +
    '• Pipeline di vendita\n' +
    '• Contratti e AUM\n' +
    '• Chiamate e Follow-up\n' +
    '• Report e Analytics\n\n' +
    '═══════════════════════════════════════\n' +
    '🚀 COME INIZIARE\n' +
    '═══════════════════════════════════════\n\n' +
    '1. Vai su DASHBOARD per vedere la panoramica\n' +
    '2. Personalizza CONFIGURAZIONE con i tuoi dati\n' +
    '3. Attiva le automazioni dal menu\n' +
    '4. Inizia a registrare chiamate e prospect\n\n' +
    '═══════════════════════════════════════\n' +
    '📞 WORKFLOW TIPICO\n' +
    '═══════════════════════════════════════\n\n' +
    '1. Registra chiamata → CRM → Gestione Chiamate\n' +
    '2. Aggiungi prospect → DATABASE CONTATTI\n' +
    '3. Gestisci pipeline → PIPELINE\n' +
    '4. Crea contratto → Gestione Contratti\n' +
    '5. Registra AUM → Gestione AUM\n\n' +
    '═══════════════════════════════════════\n' +
    '🤖 AUTOMAZIONI\n' +
    '═══════════════════════════════════════\n\n' +
    '• Report giornaliero ore 8:00\n' +
    '• Report settimanale lunedì ore 9:00\n' +
    '• Alert deal in stallo ogni giorno\n' +
    '• Alert contratti in scadenza\n\n' +
    '📧 Email inviate a: ' + CONFIG.EMAIL_NOTIFICHE + '\n\n' +
    'Per supporto: antonio@antoniotritto.com',
    ui.ButtonSet.OK
  );
}
