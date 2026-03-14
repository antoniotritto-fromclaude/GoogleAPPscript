/**
 * CRM Antonio Tritto - Google Apps Script Backend
 * Usa Google Sheets come database
 */

// ID del tuo Google Sheet (sostituisci con il tuo)
const SPREADSHEET_ID = '13rogaMAhC6XZUGLBGwe_5b3fnaIt5e90NOIReR0bzj0';

// Nomi dei fogli
const SHEETS = {
  CONTATTI: 'Contatti',
  PIPELINE: 'Pipeline',
  EMAIL_TEMPLATES: 'EmailTemplates',
  LOG_INVII: 'LogInvii',
  CONFIG: 'Config'
};

// Serve la Web App
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('CRM Antonio Tritto')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Gestisce le richieste POST (API)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    let result;
    switch(action) {
      case 'getContatti':
        result = getContatti(data.filters);
        break;
      case 'addContatto':
        result = addContatto(data.contatto);
        break;
      case 'updateContatto':
        result = updateContatto(data.id, data.contatto);
        break;
      case 'deleteContatto':
        result = deleteContatto(data.id);
        break;
      case 'getDashboard':
        result = getDashboard();
        break;
      case 'getTemplates':
        result = getTemplates();
        break;
      case 'sendFunnelEmail':
        result = sendFunnelEmail(data.contattoId);
        break;
      default:
        result = { error: 'Azione non riconosciuta' };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============ UTILITY ============

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);

  // Crea il foglio se non esiste
  if (!sheet) {
    sheet = ss.insertSheet(name);
    initializeSheet(sheet, name);
  }

  return sheet;
}

function initializeSheet(sheet, name) {
  // Intestazioni per ogni foglio
  const headers = {
    'Contatti': ['ID', 'Nome', 'Cognome', 'Email', 'Telefono', 'Azienda', 'TipoCliente', 'ClusterCliente', 'StadioPipeline', 'Probabilita', 'SommaPotenziale', 'SommaVersata', 'TipoFee', 'FunnelStatus', 'FonteAcquisizione', 'ProssimaAzione', 'Note', 'DataCreazione', 'DataUltimoContatto'],
    'Pipeline': ['ID', 'ContattoID', 'NomeDeal', 'Stage', 'AumPrevisto', 'Probabilita', 'Responsabile', 'DataCreazione'],
    'EmailTemplates': ['ID', 'Cluster', 'Step', 'GiorniAttesa', 'Oggetto', 'Corpo', 'LinkCTA'],
    'LogInvii': ['ID', 'DataInvio', 'ContattoID', 'NomeContatto', 'Cluster', 'Step', 'Oggetto', 'Email', 'Esito'],
    'Config': ['Chiave', 'Valore']
  };

  if (headers[name]) {
    sheet.getRange(1, 1, 1, headers[name].length).setValues([headers[name]]);
    sheet.getRange(1, 1, 1, headers[name].length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const objects = [];

  for (let i = 1; i < data.length; i++) {
    const obj = { _row: i + 1 };
    headers.forEach((header, j) => {
      obj[header] = data[i][j];
    });
    objects.push(obj);
  }

  return objects;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============ CONTATTI ============

function getContatti(filters = {}) {
  const sheet = getSheet(SHEETS.CONTATTI);
  let contatti = sheetToObjects(sheet);

  // Applica filtri
  if (filters.tipoCliente) {
    contatti = contatti.filter(c => c.TipoCliente === filters.tipoCliente);
  }
  if (filters.cluster) {
    contatti = contatti.filter(c => c.ClusterCliente === filters.cluster);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    contatti = contatti.filter(c =>
      (c.Nome || '').toLowerCase().includes(search) ||
      (c.Cognome || '').toLowerCase().includes(search) ||
      (c.Email || '').toLowerCase().includes(search) ||
      (c.Azienda || '').toLowerCase().includes(search)
    );
  }

  return { contatti, total: contatti.length };
}

function addContatto(contatto) {
  const sheet = getSheet(SHEETS.CONTATTI);
  const id = generateId();

  const row = [
    id,
    contatto.nome || '',
    contatto.cognome || '',
    contatto.email || '',
    contatto.telefono || '',
    contatto.azienda || '',
    contatto.tipoCliente || 'Potenziale',
    contatto.clusterCliente || '',
    contatto.stadioPipeline || 'Prospect',
    contatto.probabilita || 10,
    contatto.sommaPotenziale || 0,
    contatto.sommaVersata || 0,
    contatto.tipoFee || 'Fondo',
    contatto.funnelStatus || 'Non avviato',
    contatto.fonte || '',
    contatto.prossimaAzione || '',
    contatto.note || '',
    new Date(),
    ''
  ];

  sheet.appendRow(row);

  return { success: true, id: id };
}

function updateContatto(id, updates) {
  const sheet = getSheet(SHEETS.CONTATTI);
  const contatti = sheetToObjects(sheet);
  const contatto = contatti.find(c => c.ID === id);

  if (!contatto) {
    return { error: 'Contatto non trovato' };
  }

  const row = contatto._row;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  Object.keys(updates).forEach(key => {
    const colIndex = headers.indexOf(key);
    if (colIndex >= 0) {
      sheet.getRange(row, colIndex + 1).setValue(updates[key]);
    }
  });

  return { success: true };
}

function deleteContatto(id) {
  const sheet = getSheet(SHEETS.CONTATTI);
  const contatti = sheetToObjects(sheet);
  const contatto = contatti.find(c => c.ID === id);

  if (!contatto) {
    return { error: 'Contatto non trovato' };
  }

  sheet.deleteRow(contatto._row);
  return { success: true };
}

// ============ DASHBOARD ============

function getDashboard() {
  const contatti = sheetToObjects(getSheet(SHEETS.CONTATTI));

  // KPI
  const clienti = contatti.filter(c => c.TipoCliente === 'Gia Cliente' || c.TipoCliente === 'Cliente');
  const potenziali = contatti.filter(c => c.TipoCliente === 'Potenziale' || !c.TipoCliente);

  const aumGestito = clienti.reduce((sum, c) => sum + (parseFloat(c.SommaVersata) || 0), 0);
  const aumPipeline = potenziali.reduce((sum, c) => sum + (parseFloat(c.SommaPotenziale) || 0), 0);

  // Management Fee (0.45%) e IUNP (0.18%)
  const managementFee = aumGestito * 0.0045;
  const iunp = aumGestito * 0.0018;
  const revClienti = managementFee + iunp;

  // Revenue pipeline (pesata per probabilita)
  const revPipeline = potenziali.reduce((sum, c) => {
    const prob = (parseFloat(c.Probabilita) || 10) / 100;
    const somma = parseFloat(c.SommaPotenziale) || 0;
    return sum + (somma * prob * 0.0045);
  }, 0);

  // Funnel per stadio
  const stadi = ['Prospect', 'Lead', 'Primo Contatto', 'Appuntamento', 'Secondo Appuntamento', 'Chiusura'];
  const funnelPerStadio = stadi.map(stadio => ({
    stadio,
    count: contatti.filter(c => c.StadioPipeline === stadio).length
  }));

  // Per cluster
  const clusters = ['Imprenditore', 'Libero Professionista', 'Dipendente', 'Azienda'];
  const perCluster = clusters.map(cluster => ({
    cluster,
    clienti: clienti.filter(c => c.ClusterCliente === cluster).length,
    potenziali: potenziali.filter(c => c.ClusterCliente === cluster).length,
    aumGestito: clienti.filter(c => c.ClusterCliente === cluster)
      .reduce((sum, c) => sum + (parseFloat(c.SommaVersata) || 0), 0)
  }));

  // Per fonte
  const fonti = [...new Set(contatti.map(c => c.FonteAcquisizione).filter(f => f))];
  const perFonte = fonti.map(fonte => ({
    fonte,
    totali: contatti.filter(c => c.FonteAcquisizione === fonte).length,
    chiusi: clienti.filter(c => c.FonteAcquisizione === fonte).length
  }));

  return {
    kpi: {
      clienti: clienti.length,
      pipeline: potenziali.length,
      aumGestito,
      aumPipeline,
      revClienti,
      revPipeline,
      revTotale: revClienti + revPipeline,
      targetAum: 15000000,
      percentualeTarget: ((aumGestito + aumPipeline) / 15000000 * 100).toFixed(2)
    },
    funnelPerStadio,
    perCluster,
    perFonte,
    dettaglioFee: {
      managementFee,
      iunp
    }
  };
}

// ============ FUNNEL EMAIL ============

function getTemplates() {
  const sheet = getSheet(SHEETS.EMAIL_TEMPLATES);
  let templates = sheetToObjects(sheet);

  // Se vuoto, inserisci template predefiniti
  if (templates.length === 0) {
    initDefaultTemplates();
    templates = sheetToObjects(sheet);
  }

  return templates;
}

function initDefaultTemplates() {
  const sheet = getSheet(SHEETS.EMAIL_TEMPLATES);

  const templates = [
    ['1', 'Imprenditore', 1, 0, '{{nome}}, una cosa veloce', 'Buongiorno {{nome}},\n\nso che gestire un\'azienda ti lascia poco tempo per pensare al patrimonio personale. Ma proprio per questo ti scrivo: spesso gli imprenditori come te scoprono troppo tardi che il loro patrimonio personale e quello aziendale sono troppo legati.\n\nHo aiutato diversi imprenditori a proteggere e far crescere il loro patrimonio personale.\n\nSe vuoi, possiamo fare una chiacchierata di 15 minuti.\n\n{{cta_link}}\n\nA presto,\nAntonio Tritto', 'https://calendly.com/antoniotritto'],
    ['2', 'Imprenditore', 2, 5, '3 rischi patrimoniali che ogni imprenditore sottovaluta', 'Buongiorno {{nome}},\n\nle scrivo perche nelle ultime settimane ho incontrato diversi imprenditori che avevano trascurato 3 aspetti fondamentali:\n\n1. Separazione patrimonio personale/aziendale\n2. Pianificazione successoria\n3. Ottimizzazione fiscale degli investimenti\n\nSe vuole, posso mostrarle come affrontare questi temi.\n\n{{cta_link}}\n\nCordiali saluti,\nAntonio Tritto', 'https://calendly.com/antoniotritto'],
    ['3', 'Imprenditore', 3, 10, '{{nome}}, ho preparato qualcosa per lei', 'Buongiorno {{nome}},\n\nho preparato un breve video dove spiego come gli imprenditori possono proteggere il proprio patrimonio personale.\n\nDura solo 5 minuti e credo possa esserle utile.\n\n{{cta_link}}\n\nCordiali saluti,\nAntonio Tritto', 'https://calendly.com/antoniotritto'],
    ['4', 'Imprenditore', 4, 17, 'Un ultimo pensiero, {{nome}}', 'Buongiorno {{nome}},\n\nnelle scorse settimane le ho scritto per proporle una consulenza sulla gestione del patrimonio personale.\n\nSe non e il momento giusto, nessun problema. Le lascio i miei riferimenti per quando vorra approfondire.\n\n{{cta_link}}\n\nUn caro saluto,\nAntonio Tritto', 'https://calendly.com/antoniotritto'],
    ['5', 'Libero Professionista', 1, 0, '{{nome}}, un momento per noi', 'Buongiorno {{nome}},\n\ntra pazienti, clienti, scadenze e adempimenti, so che il tempo per pensare al proprio patrimonio e sempre poco.\n\nMa proprio per questo le scrivo: molti professionisti come lei scoprono troppo tardi che avrebbero potuto ottimizzare molto di piu.\n\nPossiamo fare una breve chiacchierata?\n\n{{cta_link}}\n\nA presto,\nAntonio Tritto', 'https://calendly.com/antoniotritto'],
    ['6', 'Libero Professionista', 2, 5, 'Quanto le costa davvero non avere una strategia fiscale?', 'Buongiorno {{nome}},\n\nle faccio una domanda diretta: sa quanto sta pagando in piu di tasse rispetto a quello che potrebbe?\n\nCon una pianificazione corretta si possono ottenere risultati significativi.\n\n{{cta_link}}\n\nCordiali saluti,\nAntonio Tritto', 'https://calendly.com/antoniotritto'],
    ['7', 'Dipendente', 1, 0, '{{nome}}, volevo assicurarmi che avesse ricevuto', 'Buongiorno {{nome}},\n\nle scrivo per riprendere il nostro contatto e capire se posso esserle utile nella gestione del suo risparmio.\n\nPossiamo fare una breve chiamata per conoscerci?\n\n{{cta_link}}\n\nA presto,\nAntonio Tritto', 'https://calendly.com/antoniotritto'],
    ['8', 'Dipendente', 2, 5, 'Il suo TFR sta perdendo valore - ecco perche', 'Buongiorno {{nome}},\n\nle dico una cosa che sorprende quasi tutti: il TFR lasciato in azienda rende molto meno dell\'inflazione.\n\nQuesto significa che ogni anno il valore reale del suo TFR diminuisce.\n\nC\'e una soluzione semplice che pochi conoscono.\n\n{{cta_link}}\n\nCordiali saluti,\nAntonio Tritto', 'https://calendly.com/antoniotritto']
  ];

  templates.forEach(t => sheet.appendRow(t));
}

function sendFunnelEmail(contattoId) {
  const contatti = sheetToObjects(getSheet(SHEETS.CONTATTI));
  const contatto = contatti.find(c => c.ID === contattoId);

  if (!contatto) {
    return { error: 'Contatto non trovato' };
  }

  if (!contatto.Email) {
    return { error: 'Contatto senza email' };
  }

  // Determina step
  let step = 1;
  const status = contatto.FunnelStatus || 'Non avviato';
  if (status === 'Step 1 inviato') step = 2;
  else if (status === 'Step 2 inviato') step = 3;
  else if (status === 'Step 3 inviato') step = 4;
  else if (status === 'Step 4 inviato' || status === 'Risposto') {
    return { error: 'Funnel completato' };
  }

  // Cluster (Azienda usa Imprenditore)
  let cluster = contatto.ClusterCliente || 'Dipendente';
  if (cluster === 'Azienda') cluster = 'Imprenditore';

  // Trova template
  const templates = sheetToObjects(getSheet(SHEETS.EMAIL_TEMPLATES));
  const template = templates.find(t => t.Cluster === cluster && parseInt(t.Step) === step);

  if (!template) {
    return { error: 'Template non trovato per ' + cluster + ' step ' + step };
  }

  // Prepara email
  const nome = contatto.Nome || '';
  const oggetto = (template.Oggetto || '').replace(/\{\{nome\}\}/gi, nome);
  const corpo = (template.Corpo || '')
    .replace(/\{\{nome\}\}/gi, nome)
    .replace(/\{\{cta_link\}\}/gi, template.LinkCTA || 'https://calendly.com/antoniotritto');

  try {
    // Invia email
    GmailApp.sendEmail(contatto.Email, oggetto, corpo);

    // Registra nel log
    const logSheet = getSheet(SHEETS.LOG_INVII);
    logSheet.appendRow([
      generateId(),
      new Date(),
      contattoId,
      nome + ' ' + (contatto.Cognome || ''),
      cluster,
      step,
      oggetto,
      contatto.Email,
      'OK'
    ]);

    // Aggiorna stato contatto
    updateContatto(contattoId, {
      FunnelStatus: 'Step ' + step + ' inviato',
      DataUltimoContatto: new Date()
    });

    return { success: true, message: 'Email Step ' + step + ' inviata a ' + nome };
  } catch(e) {
    // Registra errore
    const logSheet = getSheet(SHEETS.LOG_INVII);
    logSheet.appendRow([
      generateId(),
      new Date(),
      contattoId,
      nome,
      cluster,
      step,
      oggetto,
      contatto.Email,
      'ERRORE: ' + e.message
    ]);

    return { error: 'Errore invio: ' + e.message };
  }
}

function markAsResponded(contattoId) {
  return updateContatto(contattoId, { FunnelStatus: 'Risposto' });
}

// ============ IMPORT DATA ============

function importFromExistingData() {
  // Questa funzione importa i dati dal foglio Excel esistente
  // Puoi chiamarla manualmente una volta per popolare i dati

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sourceSheet = ss.getSheetByName('DATABASE CLIENTI') || ss.getSheetByName('📊 DATABASE CLIENTI');

  if (!sourceSheet) {
    return { error: 'Foglio sorgente non trovato' };
  }

  const targetSheet = getSheet(SHEETS.CONTATTI);
  const sourceData = sourceSheet.getDataRange().getValues();

  let imported = 0;
  for (let i = 2; i < sourceData.length; i++) { // Salta header e totali
    const row = sourceData[i];
    if (!row[1]) continue; // Salta righe vuote

    const nome = String(row[1]).trim().split(' ')[0];
    const cognome = String(row[1]).trim().split(' ').slice(1).join(' ');

    addContatto({
      nome: nome,
      cognome: cognome,
      tipoCliente: row[2] || 'Potenziale',
      fonte: row[3] || '',
      stadioPipeline: row[5] || 'Prospect',
      probabilita: row[6] || 10,
      sommaPotenziale: row[7] || 0,
      sommaVersata: row[9] || 0,
      clusterCliente: row[15] || '',
      tipoFee: row[16] || 'Fondo',
      funnelStatus: row[19] || 'Non avviato',
      email: row[21] || '',
      prossimaAzione: row[13] || '',
      note: row[14] || ''
    });
    imported++;
  }

  return { success: true, imported: imported };
}
