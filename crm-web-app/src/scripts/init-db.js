/**
 * Script di Inizializzazione Database
 */

const { initializeDatabase } = require('../models/database');

console.log('🚀 Inizializzazione database CRM...');
initializeDatabase();
console.log('✅ Database pronto!');
