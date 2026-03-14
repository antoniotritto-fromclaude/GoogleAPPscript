/**
 * Script per importare dati dal file Excel PIPELINE
 * Usa openpyxl via Python per leggere il file
 */

const { execSync } = require('child_process');
const path = require('path');

async function importFromExcel() {
  const excelPath = path.join(__dirname, '../../../PIPELINE_Antonio_Tritto_2026.xlsx');

  console.log('Lettura file Excel...');

  // Usa Python per estrarre i dati
  const pythonScript = `
import openpyxl
import json

wb = openpyxl.load_workbook('${excelPath}')

# Database Clienti
sheet = wb['📊 DATABASE CLIENTI']
clienti = []

for row in range(3, sheet.max_row + 1):
    nome = sheet.cell(row=row, column=2).value
    if not nome or nome == 'TOT':
        continue

    cliente = {
        'id': sheet.cell(row=row, column=1).value,
        'nome': str(nome).strip(),
        'tipo_cliente': sheet.cell(row=row, column=3).value or 'Potenziale',
        'fonte': sheet.cell(row=row, column=4).value,
        'data_primo_contatto': str(sheet.cell(row=row, column=5).value)[:10] if sheet.cell(row=row, column=5).value else None,
        'stadio_pipeline': sheet.cell(row=row, column=6).value or 'Prospect',
        'probabilita': sheet.cell(row=row, column=7).value or 10,
        'somma_potenziale': sheet.cell(row=row, column=8).value or 0,
        'data_versamento': str(sheet.cell(row=row, column=9).value)[:10] if sheet.cell(row=row, column=9).value else None,
        'somma_versata': sheet.cell(row=row, column=10).value or 0,
        'stato_contabilita': sheet.cell(row=row, column=11).value,
        'ultimo_contatto_tipo': sheet.cell(row=row, column=12).value,
        'data_ultimo_contatto': str(sheet.cell(row=row, column=13).value)[:10] if sheet.cell(row=row, column=13).value else None,
        'prossima_azione': sheet.cell(row=row, column=14).value,
        'note': sheet.cell(row=row, column=15).value,
        'cluster_cliente': sheet.cell(row=row, column=16).value,
        'tipo_fee': sheet.cell(row=row, column=17).value or 'Fondo',
        'funnel_status': sheet.cell(row=row, column=20).value or 'Non avviato',
        'email': sheet.cell(row=row, column=22).value
    }

    # Converti valori numerici
    try:
        cliente['probabilita'] = int(float(cliente['probabilita'])) if cliente['probabilita'] else 10
    except:
        cliente['probabilita'] = 10

    try:
        cliente['somma_potenziale'] = float(cliente['somma_potenziale']) if cliente['somma_potenziale'] else 0
    except:
        cliente['somma_potenziale'] = 0

    try:
        cliente['somma_versata'] = float(cliente['somma_versata']) if cliente['somma_versata'] else 0
    except:
        cliente['somma_versata'] = 0

    clienti.append(cliente)

# Template Email
sheet_email = wb['📧 TEMPLATE EMAIL']
templates = []

for row in range(3, 15):
    cluster = sheet_email.cell(row=row, column=1).value
    step = sheet_email.cell(row=row, column=2).value
    if not cluster or not step:
        continue

    template = {
        'cluster': cluster,
        'step': int(float(step)),
        'giorni_attesa': int(float(sheet_email.cell(row=row, column=3).value or 0)),
        'oggetto': sheet_email.cell(row=row, column=4).value,
        'corpo': sheet_email.cell(row=row, column=5).value,
        'link_cta': sheet_email.cell(row=row, column=6).value
    }
    templates.append(template)

# Log Invii
sheet_log = wb['📬 LOG INVII']
log_invii = []

for row in range(2, sheet_log.max_row + 1):
    data = sheet_log.cell(row=row, column=1).value
    if not data:
        continue

    log = {
        'data_invio': str(data)[:19] if data else None,
        'nome': sheet_log.cell(row=row, column=2).value,
        'cluster': sheet_log.cell(row=row, column=3).value,
        'step': sheet_log.cell(row=row, column=4).value,
        'oggetto': sheet_log.cell(row=row, column=5).value,
        'email': sheet_log.cell(row=row, column=6).value,
        'esito': sheet_log.cell(row=row, column=7).value or 'OK'
    }
    log_invii.append(log)

print(json.dumps({
    'clienti': clienti,
    'templates': templates,
    'log_invii': log_invii
}))
`;

  try {
    const result = execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024
    });

    const data = JSON.parse(result);
    console.log(`Trovati ${data.clienti.length} clienti, ${data.templates.length} template, ${data.log_invii.length} log`);
    return data;
  } catch (error) {
    console.error('Errore lettura Excel:', error.message);
    return null;
  }
}

async function importToDatabase() {
  const { initializeDatabase, db, saveDatabase } = require('../models/database');

  await initializeDatabase();

  const data = await importFromExcel();
  if (!data) {
    console.error('Impossibile leggere i dati Excel');
    return;
  }

  console.log('Importazione clienti...');

  // Importa clienti
  let importati = 0;
  for (const cliente of data.clienti) {
    try {
      // Separa nome e cognome
      const parti = (cliente.nome || '').split(' ');
      const nome = parti[0] || '';
      const cognome = parti.slice(1).join(' ') || '';

      // Calcola management fee e iunp
      const sommaVersata = parseFloat(cliente.somma_versata) || 0;
      const tipoFee = cliente.tipo_fee || 'Fondo';
      const managementFee = tipoFee !== 'Fee Only' && sommaVersata > 0 ? sommaVersata * 0.0045 : 0;
      const iunp36 = tipoFee !== 'Fee Only' && sommaVersata > 0 ? sommaVersata * 0.0018 : 0;

      // Determina is_cliente
      const isCliente = cliente.tipo_cliente === 'Gia Cliente' ? 1 : 0;

      db.prepare(`
        INSERT INTO contatti (
          nome, cognome, email, fonte, fonte_acquisizione,
          tipo_cliente, cluster_cliente, stadio_pipeline, probabilita,
          somma_potenziale, somma_versata, data_versamento, stato_contabilita,
          ultimo_contatto_tipo, data_ultimo_contatto, prossima_azione, note,
          tipo_fee, management_fee, iunp_36, funnel_status, is_cliente,
          aum_potenziale, data_primo_contatto
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        nome, cognome, cliente.email,
        cliente.fonte, cliente.fonte,
        cliente.tipo_cliente, cliente.cluster_cliente, cliente.stadio_pipeline,
        cliente.probabilita,
        cliente.somma_potenziale, sommaVersata,
        cliente.data_versamento, cliente.stato_contabilita,
        cliente.ultimo_contatto_tipo, cliente.data_ultimo_contatto,
        cliente.prossima_azione, cliente.note,
        tipoFee, managementFee, iunp36,
        cliente.funnel_status, isCliente,
        cliente.somma_potenziale, cliente.data_primo_contatto
      );
      importati++;
    } catch (e) {
      console.error(`Errore importazione cliente ${cliente.nome}:`, e.message);
    }
  }
  console.log(`Importati ${importati} clienti`);

  // Importa template email
  console.log('Importazione template email...');
  let templateImportati = 0;
  for (const template of data.templates) {
    try {
      // Mappa cluster
      let cluster = template.cluster;
      if (cluster === 'Professionista') cluster = 'Libero Professionista';

      db.prepare(`
        INSERT OR REPLACE INTO email_templates (cluster, step, giorni_attesa, oggetto, corpo, link_cta)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(cluster, template.step, template.giorni_attesa, template.oggetto, template.corpo, template.link_cta);
      templateImportati++;
    } catch (e) {
      console.error(`Errore importazione template:`, e.message);
    }
  }
  console.log(`Importati ${templateImportati} template`);

  // Importa log invii
  console.log('Importazione log invii...');
  let logImportati = 0;
  for (const log of data.log_invii) {
    try {
      if (!log.nome) continue;
      db.prepare(`
        INSERT INTO log_invii (data_invio, contatto_nome, cluster, step, oggetto, email_destinatario, esito)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(log.data_invio, log.nome, log.cluster, log.step, log.oggetto, log.email, log.esito);
      logImportati++;
    } catch (e) {
      console.error(`Errore importazione log:`, e.message);
    }
  }
  console.log(`Importati ${logImportati} log invii`);

  saveDatabase();
  console.log('Importazione completata!');
}

// Esegui se chiamato direttamente
if (require.main === module) {
  importToDatabase().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { importFromExcel, importToDatabase };
