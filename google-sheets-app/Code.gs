/**
 * CRM Antonio Tritto - Google Apps Script Backend
 * Versione migliorata con caching, email HTML, automazioni e pipeline
 */

// ID del tuo Google Sheet (sostituisci con il tuo)
const SPREADSHEET_ID = '13rogaMAhC6XZUGLBGwe_5b3fnaIt5e90NOIReR0bzj0';

// Nomi dei fogli
const SHEETS = {
  CONTATTI: 'Contatti',
  PIPELINE: 'Pipeline',
  EMAIL_TEMPLATES: 'EmailTemplates',
  LOG_INVII: 'LogInvii',
  ATTIVITA: 'Attivita',
  CONFIG: 'Config'
};

// Cache duration in seconds (5 minuti)
const CACHE_DURATION = 300;

// ============ WEB APP ============

function doGet(e) {
  const page = e.parameter.page || 'index';

  try {
    return HtmlService.createHtmlOutputFromFile(page)
      .setTitle('CRM Antonio Tritto')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch(err) {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('CRM Antonio Tritto')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    let result;
    switch(action) {
      // Contatti
      case 'getContatti':
        result = getContatti(data.filters);
        break;
      case 'getContatto':
        result = getContatto(data.id);
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

      // Dashboard
      case 'getDashboard':
        result = getDashboard();
        break;

      // Pipeline
      case 'getPipeline':
        result = getPipeline(data.filters);
        break;
      case 'addDeal':
        result = addDeal(data.deal);
        break;
      case 'updateDeal':
        result = updateDeal(data.id, data.deal);
        break;
      case 'deleteDeal':
        result = deleteDeal(data.id);
        break;

      // Email Funnel
      case 'getTemplates':
        result = getTemplates();
        break;
      case 'saveTemplate':
        result = saveTemplate(data.template);
        break;
      case 'sendFunnelEmail':
        result = sendFunnelEmail(data.contattoId);
        break;
      case 'sendBulkFunnel':
        result = sendBulkFunnel(data.contattoIds);
        break;
      case 'getLogInvii':
        result = getLogInvii(data.limit);
        break;

      // Attivita
      case 'getAttivita':
        result = getAttivita(data.contattoId);
        break;
      case 'addAttivita':
        result = addAttivita(data.attivita);
        break;
      case 'getReminders':
        result = getReminders();
        break;

      // Import/Export
      case 'importData':
        result = importFromExistingData();
        break;
      case 'exportData':
        result = exportData();
        break;

      default:
        result = { error: 'Azione non riconosciuta: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    Logger.log('Errore doPost: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({
      error: error.message,
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============ UTILITY ============

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    initializeSheet(sheet, name);
  }

  return sheet;
}

function initializeSheet(sheet, name) {
  const headers = {
    'Contatti': ['ID', 'Nome', 'Cognome', 'Email', 'Telefono', 'Azienda', 'TipoCliente', 'ClusterCliente', 'StadioPipeline', 'Probabilita', 'SommaPotenziale', 'SommaVersata', 'TipoFee', 'FunnelStatus', 'FonteAcquisizione', 'ProssimaAzione', 'DataProssimaAzione', 'Note', 'DataCreazione', 'DataUltimoContatto'],
    'Pipeline': ['ID', 'ContattoID', 'NomeContatto', 'NomeDeal', 'Stage', 'AumPrevisto', 'Probabilita', 'DataChiusuraPrevista', 'Responsabile', 'Note', 'DataCreazione', 'DataModifica'],
    'EmailTemplates': ['ID', 'Cluster', 'Step', 'GiorniAttesa', 'Oggetto', 'Corpo', 'CorpoHTML', 'LinkCTA', 'Attivo'],
    'LogInvii': ['ID', 'DataInvio', 'ContattoID', 'NomeContatto', 'Email', 'Cluster', 'Step', 'Oggetto', 'Esito', 'ErroreDettaglio'],
    'Attivita': ['ID', 'ContattoID', 'NomeContatto', 'Tipo', 'Descrizione', 'DataAttivita', 'Completata', 'DataCompletamento', 'Promemoria', 'DataPromemoria'],
    'Config': ['Chiave', 'Valore', 'Descrizione']
  };

  if (headers[name]) {
    sheet.getRange(1, 1, 1, headers[name].length).setValues([headers[name]]);
    sheet.getRange(1, 1, 1, headers[name].length)
      .setFontWeight('bold')
      .setBackground('#4285f4')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
}

function sheetToObjects(sheet) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'sheet_' + sheet.getName();

  // Prova a leggere dalla cache
  const cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch(e) {
      // Cache corrotta, continua a leggere dal foglio
    }
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const objects = [];

  for (let i = 1; i < data.length; i++) {
    const obj = { _row: i + 1 };
    headers.forEach((header, j) => {
      let value = data[i][j];
      // Converti date in stringhe ISO
      if (value instanceof Date) {
        value = value.toISOString();
      }
      obj[header] = value;
    });
    objects.push(obj);
  }

  // Salva in cache (max 100KB)
  try {
    const jsonStr = JSON.stringify(objects);
    if (jsonStr.length < 100000) {
      cache.put(cacheKey, jsonStr, CACHE_DURATION);
    }
  } catch(e) {
    Logger.log('Cache write error: ' + e.message);
  }

  return objects;
}

function invalidateCache(sheetName) {
  const cache = CacheService.getScriptCache();
  cache.remove('sheet_' + sheetName);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
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
  if (filters.stadio) {
    contatti = contatti.filter(c => c.StadioPipeline === filters.stadio);
  }
  if (filters.funnelStatus) {
    contatti = contatti.filter(c => c.FunnelStatus === filters.funnelStatus);
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    contatti = contatti.filter(c =>
      (c.Nome || '').toLowerCase().includes(search) ||
      (c.Cognome || '').toLowerCase().includes(search) ||
      (c.Email || '').toLowerCase().includes(search) ||
      (c.Azienda || '').toLowerCase().includes(search) ||
      (c.Telefono || '').toLowerCase().includes(search)
    );
  }

  // Ordinamento
  if (filters.orderBy) {
    const field = filters.orderBy;
    const desc = filters.orderDesc === true;
    contatti.sort((a, b) => {
      let va = a[field] || '';
      let vb = b[field] || '';
      if (typeof va === 'number' && typeof vb === 'number') {
        return desc ? vb - va : va - vb;
      }
      return desc ? String(vb).localeCompare(String(va)) : String(va).localeCompare(String(vb));
    });
  }

  return { contatti, total: contatti.length };
}

function getContatto(id) {
  const sheet = getSheet(SHEETS.CONTATTI);
  const contatti = sheetToObjects(sheet);
  const contatto = contatti.find(c => c.ID === id);

  if (!contatto) {
    return { error: 'Contatto non trovato' };
  }

  // Aggiungi attivita recenti
  const attivita = getAttivita(id);
  contatto.attivita = attivita.attivita || [];

  return contatto;
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
    contatto.dataProssimaAzione || '',
    contatto.note || '',
    new Date(),
    ''
  ];

  sheet.appendRow(row);
  invalidateCache(SHEETS.CONTATTI);

  // Log attivita
  addAttivita({
    contattoId: id,
    nomeContatto: (contatto.nome || '') + ' ' + (contatto.cognome || ''),
    tipo: 'Creazione',
    descrizione: 'Contatto creato'
  });

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

  const changes = [];
  Object.keys(updates).forEach(key => {
    const colIndex = headers.indexOf(key);
    if (colIndex >= 0) {
      const oldValue = contatto[key];
      const newValue = updates[key];
      if (oldValue !== newValue) {
        sheet.getRange(row, colIndex + 1).setValue(newValue);
        changes.push(key + ': ' + oldValue + ' -> ' + newValue);
      }
    }
  });

  invalidateCache(SHEETS.CONTATTI);

  // Log attivita se ci sono cambiamenti significativi
  if (changes.length > 0 && (updates.StadioPipeline || updates.TipoCliente)) {
    addAttivita({
      contattoId: id,
      nomeContatto: (contatto.Nome || '') + ' ' + (contatto.Cognome || ''),
      tipo: 'Aggiornamento',
      descrizione: changes.join('; ')
    });
  }

  return { success: true, changes: changes.length };
}

function deleteContatto(id) {
  const sheet = getSheet(SHEETS.CONTATTI);
  const contatti = sheetToObjects(sheet);
  const contatto = contatti.find(c => c.ID === id);

  if (!contatto) {
    return { error: 'Contatto non trovato' };
  }

  sheet.deleteRow(contatto._row);
  invalidateCache(SHEETS.CONTATTI);

  return { success: true };
}

// ============ PIPELINE ============

function getPipeline(filters = {}) {
  const sheet = getSheet(SHEETS.PIPELINE);
  let deals = sheetToObjects(sheet);

  if (filters.stage) {
    deals = deals.filter(d => d.Stage === filters.stage);
  }
  if (filters.contattoId) {
    deals = deals.filter(d => d.ContattoID === filters.contattoId);
  }

  // Calcola totali per stage
  const stages = ['Qualificazione', 'Proposta', 'Negoziazione', 'Chiusura', 'Vinto', 'Perso'];
  const perStage = stages.map(stage => {
    const dealsStage = deals.filter(d => d.Stage === stage);
    return {
      stage,
      count: dealsStage.length,
      totale: dealsStage.reduce((sum, d) => sum + (parseFloat(d.AumPrevisto) || 0), 0),
      pesato: dealsStage.reduce((sum, d) => {
        const prob = (parseFloat(d.Probabilita) || 0) / 100;
        return sum + (parseFloat(d.AumPrevisto) || 0) * prob;
      }, 0)
    };
  });

  return { deals, perStage, total: deals.length };
}

function addDeal(deal) {
  const sheet = getSheet(SHEETS.PIPELINE);
  const id = generateId();

  const row = [
    id,
    deal.contattoId || '',
    deal.nomeContatto || '',
    deal.nomeDeal || '',
    deal.stage || 'Qualificazione',
    deal.aumPrevisto || 0,
    deal.probabilita || 20,
    deal.dataChiusura || '',
    deal.responsabile || 'Antonio Tritto',
    deal.note || '',
    new Date(),
    new Date()
  ];

  sheet.appendRow(row);
  invalidateCache(SHEETS.PIPELINE);

  return { success: true, id: id };
}

function updateDeal(id, updates) {
  const sheet = getSheet(SHEETS.PIPELINE);
  const deals = sheetToObjects(sheet);
  const deal = deals.find(d => d.ID === id);

  if (!deal) {
    return { error: 'Deal non trovato' };
  }

  const row = deal._row;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  Object.keys(updates).forEach(key => {
    const colIndex = headers.indexOf(key);
    if (colIndex >= 0) {
      sheet.getRange(row, colIndex + 1).setValue(updates[key]);
    }
  });

  // Aggiorna data modifica
  const modIdx = headers.indexOf('DataModifica');
  if (modIdx >= 0) {
    sheet.getRange(row, modIdx + 1).setValue(new Date());
  }

  invalidateCache(SHEETS.PIPELINE);

  return { success: true };
}

function deleteDeal(id) {
  const sheet = getSheet(SHEETS.PIPELINE);
  const deals = sheetToObjects(sheet);
  const deal = deals.find(d => d.ID === id);

  if (!deal) {
    return { error: 'Deal non trovato' };
  }

  sheet.deleteRow(deal._row);
  invalidateCache(SHEETS.PIPELINE);

  return { success: true };
}

// ============ DASHBOARD ============

function getDashboard() {
  const contatti = sheetToObjects(getSheet(SHEETS.CONTATTI));
  const pipeline = sheetToObjects(getSheet(SHEETS.PIPELINE));

  // KPI Contatti
  const clienti = contatti.filter(c => c.TipoCliente === 'Gia Cliente' || c.TipoCliente === 'Cliente');
  const potenziali = contatti.filter(c => c.TipoCliente === 'Potenziale' || !c.TipoCliente);

  const aumGestito = clienti.reduce((sum, c) => sum + (parseFloat(c.SommaVersata) || 0), 0);
  const aumPipeline = potenziali.reduce((sum, c) => sum + (parseFloat(c.SommaPotenziale) || 0), 0);

  // Revenue (Management Fee 0.45% + IUNP 0.18%)
  const managementFee = aumGestito * 0.0045;
  const iunp = aumGestito * 0.0018;
  const revClienti = managementFee + iunp;

  const revPipeline = potenziali.reduce((sum, c) => {
    const prob = (parseFloat(c.Probabilita) || 10) / 100;
    const somma = parseFloat(c.SommaPotenziale) || 0;
    return sum + (somma * prob * 0.0063);
  }, 0);

  // Funnel per stadio
  const stadi = ['Prospect', 'Lead', 'Primo Contatto', 'Appuntamento', 'Secondo Appuntamento', 'Chiusura'];
  const funnelPerStadio = stadi.map(stadio => ({
    stadio,
    count: contatti.filter(c => c.StadioPipeline === stadio).length,
    valore: contatti.filter(c => c.StadioPipeline === stadio)
      .reduce((sum, c) => sum + (parseFloat(c.SommaPotenziale) || parseFloat(c.SommaVersata) || 0), 0)
  }));

  // Per cluster
  const clusters = ['Imprenditore', 'Libero Professionista', 'Dipendente', 'Azienda'];
  const perCluster = clusters.map(cluster => ({
    cluster,
    clienti: clienti.filter(c => c.ClusterCliente === cluster).length,
    potenziali: potenziali.filter(c => c.ClusterCliente === cluster).length,
    aumGestito: clienti.filter(c => c.ClusterCliente === cluster)
      .reduce((sum, c) => sum + (parseFloat(c.SommaVersata) || 0), 0),
    aumPipeline: potenziali.filter(c => c.ClusterCliente === cluster)
      .reduce((sum, c) => sum + (parseFloat(c.SommaPotenziale) || 0), 0)
  }));

  // Per fonte acquisizione
  const fonti = [...new Set(contatti.map(c => c.FonteAcquisizione).filter(f => f))];
  const perFonte = fonti.map(fonte => ({
    fonte,
    totali: contatti.filter(c => c.FonteAcquisizione === fonte).length,
    chiusi: clienti.filter(c => c.FonteAcquisizione === fonte).length,
    conversionRate: (() => {
      const tot = contatti.filter(c => c.FonteAcquisizione === fonte).length;
      const chi = clienti.filter(c => c.FonteAcquisizione === fonte).length;
      return tot > 0 ? ((chi / tot) * 100).toFixed(1) : 0;
    })()
  }));

  // Email Funnel Stats
  const funnelStats = {
    nonAvviato: contatti.filter(c => !c.FunnelStatus || c.FunnelStatus === 'Non avviato').length,
    step1: contatti.filter(c => c.FunnelStatus === 'Step 1 inviato').length,
    step2: contatti.filter(c => c.FunnelStatus === 'Step 2 inviato').length,
    step3: contatti.filter(c => c.FunnelStatus === 'Step 3 inviato').length,
    step4: contatti.filter(c => c.FunnelStatus === 'Step 4 inviato').length,
    risposto: contatti.filter(c => c.FunnelStatus === 'Risposto').length
  };

  // Pipeline summary
  const pipelineDeals = pipeline.filter(d => d.Stage !== 'Vinto' && d.Stage !== 'Perso');
  const pipelineSummary = {
    totaleDeals: pipelineDeals.length,
    valoreTotal: pipelineDeals.reduce((sum, d) => sum + (parseFloat(d.AumPrevisto) || 0), 0),
    valorePesato: pipelineDeals.reduce((sum, d) => {
      const prob = (parseFloat(d.Probabilita) || 0) / 100;
      return sum + (parseFloat(d.AumPrevisto) || 0) * prob;
    }, 0),
    vinti: pipeline.filter(d => d.Stage === 'Vinto').length,
    persi: pipeline.filter(d => d.Stage === 'Perso').length
  };

  // Prossime azioni (reminders)
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  const prossimiGiorni = new Date(oggi.getTime() + 7 * 24 * 60 * 60 * 1000);

  const prossimaAzioni = contatti
    .filter(c => c.DataProssimaAzione && new Date(c.DataProssimaAzione) <= prossimiGiorni)
    .map(c => ({
      id: c.ID,
      nome: (c.Nome || '') + ' ' + (c.Cognome || ''),
      azione: c.ProssimaAzione,
      data: c.DataProssimaAzione
    }))
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .slice(0, 10);

  return {
    kpi: {
      clienti: clienti.length,
      pipeline: potenziali.length,
      totaleContatti: contatti.length,
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
    funnelStats,
    pipelineSummary,
    prossimaAzioni,
    dettaglioFee: {
      managementFee,
      iunp
    }
  };
}

// ============ EMAIL FUNNEL ============

function getTemplates() {
  const sheet = getSheet(SHEETS.EMAIL_TEMPLATES);
  let templates = sheetToObjects(sheet);

  if (templates.length === 0) {
    initDefaultTemplates();
    templates = sheetToObjects(sheet);
  }

  return templates;
}

function saveTemplate(template) {
  const sheet = getSheet(SHEETS.EMAIL_TEMPLATES);
  const templates = sheetToObjects(sheet);

  if (template.id) {
    // Update existing
    const existing = templates.find(t => t.ID === template.id);
    if (existing) {
      const row = existing._row;
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

      Object.keys(template).forEach(key => {
        const colIndex = headers.indexOf(key);
        if (colIndex >= 0 && key !== 'id') {
          sheet.getRange(row, colIndex + 1).setValue(template[key]);
        }
      });

      invalidateCache(SHEETS.EMAIL_TEMPLATES);
      return { success: true, id: template.id };
    }
  }

  // Add new
  const id = generateId();
  const row = [
    id,
    template.cluster || '',
    template.step || 1,
    template.giorniAttesa || 0,
    template.oggetto || '',
    template.corpo || '',
    template.corpoHTML || '',
    template.linkCTA || 'https://calendly.com/antoniotritto',
    template.attivo !== false
  ];

  sheet.appendRow(row);
  invalidateCache(SHEETS.EMAIL_TEMPLATES);

  return { success: true, id: id };
}

function initDefaultTemplates() {
  const sheet = getSheet(SHEETS.EMAIL_TEMPLATES);

  const templates = [
    // Imprenditore (4 step)
    ['1', 'Imprenditore', 1, 0, '{{nome}}, una cosa veloce',
     'Buongiorno {{nome}},\n\nso che gestire un\'azienda ti lascia poco tempo per pensare al patrimonio personale. Ma proprio per questo ti scrivo: spesso gli imprenditori come te scoprono troppo tardi che il loro patrimonio personale e quello aziendale sono troppo legati.\n\nHo aiutato diversi imprenditori a proteggere e far crescere il loro patrimonio personale.\n\nSe vuoi, possiamo fare una chiacchierata di 15 minuti.\n\n{{cta_link}}\n\nA presto,\nAntonio Tritto',
     createHTMLEmail('{{nome}}, una cosa veloce', 'Buongiorno {{nome}},<br><br>so che gestire un\'azienda ti lascia poco tempo per pensare al patrimonio personale. Ma proprio per questo ti scrivo: spesso gli imprenditori come te scoprono troppo tardi che il loro patrimonio personale e quello aziendale sono troppo legati.<br><br>Ho aiutato diversi imprenditori a proteggere e far crescere il loro patrimonio personale.<br><br>Se vuoi, possiamo fare una chiacchierata di 15 minuti.', '{{cta_link}}', 'Prenota una chiamata'),
     'https://calendly.com/antoniotritto', true],

    ['2', 'Imprenditore', 2, 5, '3 rischi patrimoniali che ogni imprenditore sottovaluta',
     'Buongiorno {{nome}},\n\nle scrivo perche nelle ultime settimane ho incontrato diversi imprenditori che avevano trascurato 3 aspetti fondamentali:\n\n1. Separazione patrimonio personale/aziendale\n2. Pianificazione successoria\n3. Ottimizzazione fiscale degli investimenti\n\nSe vuole, posso mostrarle come affrontare questi temi.\n\n{{cta_link}}\n\nCordiali saluti,\nAntonio Tritto',
     createHTMLEmail('3 rischi patrimoniali che ogni imprenditore sottovaluta', 'Buongiorno {{nome}},<br><br>le scrivo perche nelle ultime settimane ho incontrato diversi imprenditori che avevano trascurato 3 aspetti fondamentali:<br><br><ol><li>Separazione patrimonio personale/aziendale</li><li>Pianificazione successoria</li><li>Ottimizzazione fiscale degli investimenti</li></ol><br>Se vuole, posso mostrarle come affrontare questi temi.', '{{cta_link}}', 'Fissiamo un appuntamento'),
     'https://calendly.com/antoniotritto', true],

    ['3', 'Imprenditore', 3, 10, '{{nome}}, ho preparato qualcosa per lei',
     'Buongiorno {{nome}},\n\nho preparato un breve video dove spiego come gli imprenditori possono proteggere il proprio patrimonio personale.\n\nDura solo 5 minuti e credo possa esserle utile.\n\n{{cta_link}}\n\nCordiali saluti,\nAntonio Tritto',
     createHTMLEmail('{{nome}}, ho preparato qualcosa per lei', 'Buongiorno {{nome}},<br><br>ho preparato un breve video dove spiego come gli imprenditori possono proteggere il proprio patrimonio personale.<br><br>Dura solo 5 minuti e credo possa esserle utile.', '{{cta_link}}', 'Guarda il video'),
     'https://calendly.com/antoniotritto', true],

    ['4', 'Imprenditore', 4, 17, 'Un ultimo pensiero, {{nome}}',
     'Buongiorno {{nome}},\n\nnelle scorse settimane le ho scritto per proporle una consulenza sulla gestione del patrimonio personale.\n\nSe non e il momento giusto, nessun problema. Le lascio i miei riferimenti per quando vorra approfondire.\n\n{{cta_link}}\n\nUn caro saluto,\nAntonio Tritto',
     createHTMLEmail('Un ultimo pensiero, {{nome}}', 'Buongiorno {{nome}},<br><br>nelle scorse settimane le ho scritto per proporle una consulenza sulla gestione del patrimonio personale.<br><br>Se non e il momento giusto, nessun problema. Le lascio i miei riferimenti per quando vorra approfondire.', '{{cta_link}}', 'Contattami quando vuoi'),
     'https://calendly.com/antoniotritto', true],

    // Libero Professionista (4 step)
    ['5', 'Libero Professionista', 1, 0, '{{nome}}, un momento per noi',
     'Buongiorno {{nome}},\n\ntra pazienti, clienti, scadenze e adempimenti, so che il tempo per pensare al proprio patrimonio e sempre poco.\n\nMa proprio per questo le scrivo: molti professionisti come lei scoprono troppo tardi che avrebbero potuto ottimizzare molto di piu.\n\nPossiamo fare una breve chiacchierata?\n\n{{cta_link}}\n\nA presto,\nAntonio Tritto',
     createHTMLEmail('{{nome}}, un momento per noi', 'Buongiorno {{nome}},<br><br>tra pazienti, clienti, scadenze e adempimenti, so che il tempo per pensare al proprio patrimonio e sempre poco.<br><br>Ma proprio per questo le scrivo: molti professionisti come lei scoprono troppo tardi che avrebbero potuto ottimizzare molto di piu.<br><br>Possiamo fare una breve chiacchierata?', '{{cta_link}}', 'Prenota 15 minuti'),
     'https://calendly.com/antoniotritto', true],

    ['6', 'Libero Professionista', 2, 5, 'Quanto le costa davvero non avere una strategia fiscale?',
     'Buongiorno {{nome}},\n\nle faccio una domanda diretta: sa quanto sta pagando in piu di tasse rispetto a quello che potrebbe?\n\nCon una pianificazione corretta si possono ottenere risultati significativi.\n\n{{cta_link}}\n\nCordiali saluti,\nAntonio Tritto',
     createHTMLEmail('Quanto le costa davvero non avere una strategia fiscale?', 'Buongiorno {{nome}},<br><br>le faccio una domanda diretta: sa quanto sta pagando in piu di tasse rispetto a quello che potrebbe?<br><br>Con una pianificazione corretta si possono ottenere risultati significativi.', '{{cta_link}}', 'Scopri come'),
     'https://calendly.com/antoniotritto', true],

    ['7', 'Libero Professionista', 3, 10, 'I 3 errori piu comuni dei professionisti',
     'Buongiorno {{nome}},\n\nho notato che molti professionisti commettono questi 3 errori:\n\n1. Non separare conto personale e professionale\n2. Ignorare la previdenza complementare\n3. Non pianificare per il lungo termine\n\nVuole scoprire come evitarli?\n\n{{cta_link}}\n\nCordiali saluti,\nAntonio Tritto',
     createHTMLEmail('I 3 errori piu comuni dei professionisti', 'Buongiorno {{nome}},<br><br>ho notato che molti professionisti commettono questi 3 errori:<br><br><ol><li>Non separare conto personale e professionale</li><li>Ignorare la previdenza complementare</li><li>Non pianificare per il lungo termine</li></ol><br>Vuole scoprire come evitarli?', '{{cta_link}}', 'Si, voglio saperne di piu'),
     'https://calendly.com/antoniotritto', true],

    ['8', 'Libero Professionista', 4, 17, 'Ultima occasione, {{nome}}',
     'Buongiorno {{nome}},\n\nquesta e l\'ultima email che le invio su questo argomento.\n\nSe in futuro vorra approfondire come ottimizzare il suo patrimonio, sa dove trovarmi.\n\n{{cta_link}}\n\nIn bocca al lupo per tutto,\nAntonio Tritto',
     createHTMLEmail('Ultima occasione, {{nome}}', 'Buongiorno {{nome}},<br><br>questa e l\'ultima email che le invio su questo argomento.<br><br>Se in futuro vorra approfondire come ottimizzare il suo patrimonio, sa dove trovarmi.', '{{cta_link}}', 'Resto a disposizione'),
     'https://calendly.com/antoniotritto', true],

    // Dipendente (4 step)
    ['9', 'Dipendente', 1, 0, '{{nome}}, volevo assicurarmi che avesse ricevuto',
     'Buongiorno {{nome}},\n\nle scrivo per riprendere il nostro contatto e capire se posso esserle utile nella gestione del suo risparmio.\n\nPossiamo fare una breve chiamata per conoscerci?\n\n{{cta_link}}\n\nA presto,\nAntonio Tritto',
     createHTMLEmail('{{nome}}, volevo assicurarmi che avesse ricevuto', 'Buongiorno {{nome}},<br><br>le scrivo per riprendere il nostro contatto e capire se posso esserle utile nella gestione del suo risparmio.<br><br>Possiamo fare una breve chiamata per conoscerci?', '{{cta_link}}', 'Prenota una chiamata'),
     'https://calendly.com/antoniotritto', true],

    ['10', 'Dipendente', 2, 5, 'Il suo TFR sta perdendo valore - ecco perche',
     'Buongiorno {{nome}},\n\nle dico una cosa che sorprende quasi tutti: il TFR lasciato in azienda rende molto meno dell\'inflazione.\n\nQuesto significa che ogni anno il valore reale del suo TFR diminuisce.\n\nC\'e una soluzione semplice che pochi conoscono.\n\n{{cta_link}}\n\nCordiali saluti,\nAntonio Tritto',
     createHTMLEmail('Il suo TFR sta perdendo valore - ecco perche', 'Buongiorno {{nome}},<br><br>le dico una cosa che sorprende quasi tutti: il TFR lasciato in azienda rende molto meno dell\'inflazione.<br><br>Questo significa che ogni anno il valore reale del suo TFR diminuisce.<br><br>C\'e una soluzione semplice che pochi conoscono.', '{{cta_link}}', 'Scopri la soluzione'),
     'https://calendly.com/antoniotritto', true],

    ['11', 'Dipendente', 3, 10, '{{nome}}, il fondo pensione giusto fa la differenza',
     'Buongiorno {{nome}},\n\nsa che scegliendo il fondo pensione giusto puo risparmiare migliaia di euro in tasse ogni anno?\n\nE non solo: puo anche far crescere il suo capitale piu velocemente.\n\nLe spiego come in una breve chiamata.\n\n{{cta_link}}\n\nCordiali saluti,\nAntonio Tritto',
     createHTMLEmail('{{nome}}, il fondo pensione giusto fa la differenza', 'Buongiorno {{nome}},<br><br>sa che scegliendo il fondo pensione giusto puo risparmiare migliaia di euro in tasse ogni anno?<br><br>E non solo: puo anche far crescere il suo capitale piu velocemente.<br><br>Le spiego come in una breve chiamata.', '{{cta_link}}', 'Prenota la chiamata'),
     'https://calendly.com/antoniotritto', true],

    ['12', 'Dipendente', 4, 17, '{{nome}}, resto a disposizione',
     'Buongiorno {{nome}},\n\nqueste erano le ultime informazioni che volevo condividere con lei.\n\nSe in futuro avra bisogno di una consulenza per gestire al meglio i suoi risparmi, sa dove trovarmi.\n\n{{cta_link}}\n\nUn caro saluto,\nAntonio Tritto',
     createHTMLEmail('{{nome}}, resto a disposizione', 'Buongiorno {{nome}},<br><br>queste erano le ultime informazioni che volevo condividere con lei.<br><br>Se in futuro avra bisogno di una consulenza per gestire al meglio i suoi risparmi, sa dove trovarmi.', '{{cta_link}}', 'Contattami quando vuoi'),
     'https://calendly.com/antoniotritto', true]
  ];

  templates.forEach(t => sheet.appendRow(t));
  invalidateCache(SHEETS.EMAIL_TEMPLATES);
}

function createHTMLEmail(title, body, ctaLink, ctaText) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);padding:30px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;">Antonio Tritto</h1>
              <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;font-size:14px;">Consulente Finanziario</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <p style="font-size:16px;line-height:1.6;color:#333333;margin:0 0 20px;">${body}</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:20px 0;">
                    <a href="${ctaLink}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#ffffff;text-decoration:none;padding:14px 30px;border-radius:6px;font-weight:bold;font-size:16px;">${ctaText}</a>
                  </td>
                </tr>
              </table>
              <p style="font-size:16px;line-height:1.6;color:#333333;margin:20px 0 0;">A presto,<br><strong>Antonio Tritto</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="font-size:12px;color:#6b7280;margin:0;">Antonio Tritto - Consulente Finanziario</p>
              <p style="font-size:12px;color:#6b7280;margin:5px 0 0;">Se non vuoi piu ricevere queste email, rispondi con "STOP"</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

  // Determina step corrente
  let step = 1;
  const status = contatto.FunnelStatus || 'Non avviato';
  if (status === 'Step 1 inviato') step = 2;
  else if (status === 'Step 2 inviato') step = 3;
  else if (status === 'Step 3 inviato') step = 4;
  else if (status === 'Step 4 inviato' || status === 'Risposto' || status === 'Completato') {
    return { error: 'Funnel gia completato' };
  }

  // Cluster (Azienda usa template Imprenditore)
  let cluster = contatto.ClusterCliente || 'Dipendente';
  if (cluster === 'Azienda') cluster = 'Imprenditore';

  // Trova template
  const templates = sheetToObjects(getSheet(SHEETS.EMAIL_TEMPLATES));
  const template = templates.find(t => t.Cluster === cluster && parseInt(t.Step) === step && t.Attivo !== false);

  if (!template) {
    return { error: 'Template non trovato per ' + cluster + ' step ' + step };
  }

  // Prepara email
  const nome = contatto.Nome || '';
  const cognome = contatto.Cognome || '';
  const nomeCompleto = (nome + ' ' + cognome).trim();

  const oggetto = (template.Oggetto || '').replace(/\{\{nome\}\}/gi, nome);

  // Usa HTML se disponibile, altrimenti plain text
  let corpo, isHtml = false;
  if (template.CorpoHTML) {
    corpo = template.CorpoHTML
      .replace(/\{\{nome\}\}/gi, nome)
      .replace(/\{\{cognome\}\}/gi, cognome)
      .replace(/\{\{cta_link\}\}/gi, template.LinkCTA || 'https://calendly.com/antoniotritto');
    isHtml = true;
  } else {
    corpo = (template.Corpo || '')
      .replace(/\{\{nome\}\}/gi, nome)
      .replace(/\{\{cognome\}\}/gi, cognome)
      .replace(/\{\{cta_link\}\}/gi, template.LinkCTA || 'https://calendly.com/antoniotritto');
  }

  try {
    // Invia email
    if (isHtml) {
      GmailApp.sendEmail(contatto.Email, oggetto, corpo.replace(/<[^>]*>/g, ''), {
        htmlBody: corpo,
        name: 'Antonio Tritto'
      });
    } else {
      GmailApp.sendEmail(contatto.Email, oggetto, corpo, {
        name: 'Antonio Tritto'
      });
    }

    // Registra nel log
    logEmailSent(contattoId, nomeCompleto, contatto.Email, cluster, step, oggetto, 'OK', '');

    // Aggiorna stato contatto
    const newStatus = step === 4 ? 'Completato' : 'Step ' + step + ' inviato';
    updateContatto(contattoId, {
      FunnelStatus: newStatus,
      DataUltimoContatto: new Date()
    });

    return { success: true, message: 'Email Step ' + step + ' inviata a ' + nomeCompleto };
  } catch(e) {
    // Registra errore
    logEmailSent(contattoId, nomeCompleto, contatto.Email, cluster, step, oggetto, 'ERRORE', e.message);

    return { error: 'Errore invio: ' + e.message };
  }
}

function sendBulkFunnel(contattoIds) {
  const results = {
    successi: 0,
    errori: 0,
    dettagli: []
  };

  contattoIds.forEach(id => {
    const result = sendFunnelEmail(id);
    if (result.success) {
      results.successi++;
      results.dettagli.push({ id, status: 'OK', message: result.message });
    } else {
      results.errori++;
      results.dettagli.push({ id, status: 'ERRORE', message: result.error });
    }

    // Pausa per non superare limiti Gmail
    Utilities.sleep(1000);
  });

  return results;
}

function logEmailSent(contattoId, nomeContatto, email, cluster, step, oggetto, esito, errore) {
  const logSheet = getSheet(SHEETS.LOG_INVII);
  logSheet.appendRow([
    generateId(),
    new Date(),
    contattoId,
    nomeContatto,
    email,
    cluster,
    step,
    oggetto,
    esito,
    errore
  ]);
  invalidateCache(SHEETS.LOG_INVII);
}

function getLogInvii(limit = 50) {
  const sheet = getSheet(SHEETS.LOG_INVII);
  let logs = sheetToObjects(sheet);

  // Ordina per data decrescente
  logs.sort((a, b) => new Date(b.DataInvio) - new Date(a.DataInvio));

  return logs.slice(0, limit);
}

function markAsResponded(contattoId) {
  const result = updateContatto(contattoId, { FunnelStatus: 'Risposto' });

  // Log attivita
  const contatti = sheetToObjects(getSheet(SHEETS.CONTATTI));
  const contatto = contatti.find(c => c.ID === contattoId);
  if (contatto) {
    addAttivita({
      contattoId: contattoId,
      nomeContatto: (contatto.Nome || '') + ' ' + (contatto.Cognome || ''),
      tipo: 'Risposta',
      descrizione: 'Il contatto ha risposto al funnel email'
    });
  }

  return result;
}

// ============ ATTIVITA ============

function getAttivita(contattoId) {
  const sheet = getSheet(SHEETS.ATTIVITA);
  let attivita = sheetToObjects(sheet);

  if (contattoId) {
    attivita = attivita.filter(a => a.ContattoID === contattoId);
  }

  // Ordina per data decrescente
  attivita.sort((a, b) => new Date(b.DataAttivita) - new Date(a.DataAttivita));

  return { attivita };
}

function addAttivita(attivita) {
  const sheet = getSheet(SHEETS.ATTIVITA);
  const id = generateId();

  const row = [
    id,
    attivita.contattoId || '',
    attivita.nomeContatto || '',
    attivita.tipo || 'Nota',
    attivita.descrizione || '',
    new Date(),
    attivita.completata || false,
    attivita.completata ? new Date() : '',
    attivita.promemoria || false,
    attivita.dataPromemoria || ''
  ];

  sheet.appendRow(row);
  invalidateCache(SHEETS.ATTIVITA);

  return { success: true, id: id };
}

function getReminders() {
  const sheet = getSheet(SHEETS.ATTIVITA);
  const attivita = sheetToObjects(sheet);

  const oggi = new Date();
  oggi.setHours(23, 59, 59, 999);

  const reminders = attivita
    .filter(a => a.Promemoria && !a.Completata && a.DataPromemoria && new Date(a.DataPromemoria) <= oggi)
    .sort((a, b) => new Date(a.DataPromemoria) - new Date(b.DataPromemoria));

  return reminders;
}

// ============ TRIGGERS AUTOMATICI ============

function setupTriggers() {
  // Rimuovi trigger esistenti
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));

  // Trigger giornaliero per invio automatico funnel (ore 9:00)
  ScriptApp.newTrigger('autoSendFunnelEmails')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  // Trigger giornaliero per reminder (ore 8:00)
  ScriptApp.newTrigger('sendDailyReminders')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  return { success: true, message: 'Triggers configurati' };
}

function autoSendFunnelEmails() {
  // Trova contatti pronti per il prossimo step del funnel
  const contatti = sheetToObjects(getSheet(SHEETS.CONTATTI));
  const templates = sheetToObjects(getSheet(SHEETS.EMAIL_TEMPLATES));
  const logs = sheetToObjects(getSheet(SHEETS.LOG_INVII));

  const oggi = new Date();
  let invii = 0;

  contatti.forEach(contatto => {
    if (!contatto.Email || contatto.TipoCliente === 'Gia Cliente' || contatto.TipoCliente === 'Cliente') {
      return;
    }

    const status = contatto.FunnelStatus || 'Non avviato';
    if (status === 'Risposto' || status === 'Completato' || status === 'Step 4 inviato') {
      return;
    }

    // Trova ultimo invio per questo contatto
    const ultimoInvio = logs
      .filter(l => l.ContattoID === contatto.ID && l.Esito === 'OK')
      .sort((a, b) => new Date(b.DataInvio) - new Date(a.DataInvio))[0];

    let step = 1;
    if (status === 'Step 1 inviato') step = 2;
    else if (status === 'Step 2 inviato') step = 3;
    else if (status === 'Step 3 inviato') step = 4;

    // Se non e il primo step, controlla i giorni di attesa
    if (step > 1 && ultimoInvio) {
      let cluster = contatto.ClusterCliente || 'Dipendente';
      if (cluster === 'Azienda') cluster = 'Imprenditore';

      const template = templates.find(t => t.Cluster === cluster && parseInt(t.Step) === step);
      if (!template) return;

      const giorniAttesa = parseInt(template.GiorniAttesa) || 5;
      const dataUltimoInvio = new Date(ultimoInvio.DataInvio);
      const giorniPassati = Math.floor((oggi - dataUltimoInvio) / (1000 * 60 * 60 * 24));

      if (giorniPassati < giorniAttesa) {
        return; // Non ancora il momento
      }
    }

    // Invia email (max 20 al giorno per evitare limiti)
    if (invii < 20) {
      const result = sendFunnelEmail(contatto.ID);
      if (result.success) {
        invii++;
        Utilities.sleep(2000); // Pausa tra invii
      }
    }
  });

  Logger.log('Auto funnel: ' + invii + ' email inviate');
}

function sendDailyReminders() {
  const reminders = getReminders();

  if (reminders.length === 0) return;

  // Invia email riepilogativa
  const body = reminders.map(r =>
    '- ' + r.NomeContatto + ': ' + r.Descrizione
  ).join('\n');

  try {
    GmailApp.sendEmail(
      Session.getActiveUser().getEmail(),
      'CRM - ' + reminders.length + ' promemoria per oggi',
      'Hai ' + reminders.length + ' attivita da completare:\n\n' + body + '\n\nAccedi al CRM per i dettagli.'
    );
  } catch(e) {
    Logger.log('Errore invio reminder: ' + e.message);
  }
}

// ============ IMPORT/EXPORT ============

function importFromExistingData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sourceSheet = ss.getSheetByName('DATABASE CLIENTI') || ss.getSheetByName('📊 DATABASE CLIENTI');

  if (!sourceSheet) {
    return { error: 'Foglio sorgente non trovato' };
  }

  const targetSheet = getSheet(SHEETS.CONTATTI);
  const sourceData = sourceSheet.getDataRange().getValues();

  let imported = 0;
  let skipped = 0;

  for (let i = 2; i < sourceData.length; i++) {
    const row = sourceData[i];
    if (!row[1]) {
      skipped++;
      continue;
    }

    const nomeCompleto = String(row[1]).trim();
    const nome = nomeCompleto.split(' ')[0];
    const cognome = nomeCompleto.split(' ').slice(1).join(' ');

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

  return { success: true, imported: imported, skipped: skipped };
}

function exportData() {
  const contatti = sheetToObjects(getSheet(SHEETS.CONTATTI));
  const pipeline = sheetToObjects(getSheet(SHEETS.PIPELINE));
  const attivita = sheetToObjects(getSheet(SHEETS.ATTIVITA));
  const logs = sheetToObjects(getSheet(SHEETS.LOG_INVII));

  return {
    contatti,
    pipeline,
    attivita,
    logs,
    exportDate: new Date().toISOString()
  };
}

// ============ MENU CUSTOM ============

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('CRM Antonio Tritto')
    .addItem('Apri Web App', 'openWebApp')
    .addSeparator()
    .addItem('Importa dati esistenti', 'importFromExistingData')
    .addItem('Configura triggers automatici', 'setupTriggers')
    .addSeparator()
    .addItem('Invia funnel automatico', 'autoSendFunnelEmails')
    .addItem('Invia promemoria giornalieri', 'sendDailyReminders')
    .addToUi();
}

function openWebApp() {
  const url = ScriptApp.getService().getUrl();
  const html = HtmlService.createHtmlOutput('<script>window.open("' + url + '");google.script.host.close();</script>')
    .setWidth(200)
    .setHeight(50);
  SpreadsheetApp.getUi().showModalDialog(html, 'Apertura CRM...');
}
