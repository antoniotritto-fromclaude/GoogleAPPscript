/**
 * ═══════════════════════════════════════════════════════════════════
 * TEST DIAGNOSTICO - Verifica Caricamento File
 * ═══════════════════════════════════════════════════════════════════
 * Esegui questa funzione per verificare che tutti i file siano caricati
 */

function testDiagnostico() {
  const ui = SpreadsheetApp.getUi();
  let report = '🔍 DIAGNOSTICA SISTEMA\n\n';

  // Test 1: Spreadsheet
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      report += '✅ Spreadsheet: OK\n';
      report += '   Nome: ' + ss.getName() + '\n\n';
    } else {
      report += '❌ Spreadsheet: ERRORE - undefined\n\n';
    }
  } catch (e) {
    report += '❌ Spreadsheet: ERRORE - ' + e + '\n\n';
  }

  // Test 2: Funzioni Code.gs
  try {
    if (typeof createAllSheets === 'function') {
      report += '✅ Code.gs: Caricato\n';
      report += '   createAllSheets: presente\n';
      report += '   setupCompletoSistema: presente\n\n';
    } else {
      report += '❌ Code.gs: createAllSheets non trovata\n\n';
    }
  } catch (e) {
    report += '❌ Code.gs: ERRORE - ' + e + '\n\n';
  }

  // Test 3: Funzioni Functions.gs
  try {
    if (typeof setupCanaliAcquisizione === 'function') {
      report += '✅ Functions.gs: Caricato\n';
      report += '   setupCanaliAcquisizione: presente\n';
      report += '   popolaDatiEsempioCompleti: ' + (typeof popolaDatiEsempioCompleti === 'function' ? 'presente' : 'MANCANTE') + '\n\n';
    } else {
      report += '❌ Functions.gs: setupCanaliAcquisizione NON TROVATA!\n';
      report += '   ⚠️ Il file Functions.gs non è caricato correttamente\n\n';
    }
  } catch (e) {
    report += '❌ Functions.gs: ERRORE - ' + e + '\n\n';
  }

  // Test 4: Funzioni Interactive.gs
  try {
    if (typeof registraNuovaChiamata === 'function') {
      report += '✅ Interactive.gs: Caricato\n';
      report += '   registraNuovaChiamata: presente\n\n';
    } else {
      report += '❌ Interactive.gs: registraNuovaChiamata NON TROVATA!\n\n';
    }
  } catch (e) {
    report += '❌ Interactive.gs: ERRORE - ' + e + '\n\n';
  }

  // Test 5: Funzioni Automations.gs
  try {
    if (typeof attivaAutomazioni === 'function') {
      report += '✅ Automations.gs: Caricato\n';
      report += '   attivaAutomazioni: presente\n\n';
    } else {
      report += '❌ Automations.gs: attivaAutomazioni NON TROVATA!\n\n';
    }
  } catch (e) {
    report += '❌ Automations.gs: ERRORE - ' + e + '\n\n';
  }

  // Test 6: Conta file caricati
  let fileOk = 0;
  if (typeof createAllSheets === 'function') fileOk++;
  if (typeof setupCanaliAcquisizione === 'function') fileOk++;
  if (typeof registraNuovaChiamata === 'function') fileOk++;
  if (typeof attivaAutomazioni === 'function') fileOk++;

  report += '═══════════════════════════════\n';
  report += 'RISULTATO: ' + fileOk + '/4 file caricati\n';

  if (fileOk === 4) {
    report += '\n✅ TUTTO OK! Puoi procedere con il setup.';
  } else {
    report += '\n❌ PROBLEMA: Mancano ' + (4 - fileOk) + ' file!\n\n';
    report += 'SOLUZIONE:\n';
    report += '1. Verifica di avere 4 file in Apps Script\n';
    report += '2. Ricarica i file mancanti da GitHub\n';
    report += '3. Salva (icona floppy disk)\n';
    report += '4. Ricarica il foglio (F5)\n';
    report += '5. Esegui questo test di nuovo';
  }

  ui.alert(report);

  // Log dettagliato
  Logger.log(report);
  Logger.log('\n=== DETTAGLI TECNICI ===');
  Logger.log('typeof setupCanaliAcquisizione: ' + typeof setupCanaliAcquisizione);
  Logger.log('typeof popolaDatiEsempioCompleti: ' + typeof popolaDatiEsempioCompleti);
  Logger.log('typeof registraNuovaChiamata: ' + typeof registraNuovaChiamata);
  Logger.log('typeof attivaAutomazioni: ' + typeof attivaAutomazioni);
}