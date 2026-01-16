/**
 * Admin Routes - Database Management
 * CRM Antonio Tritto
 */

const express = require('express');
const router = express.Router();
const { db, saveDatabase } = require('../models/database');

// Get database statistics
router.get('/stats', (req, res) => {
  try {
    const stats = {
      contatti: db.prepare('SELECT COUNT(*) as count FROM contatti').get().count,
      pipeline: db.prepare('SELECT COUNT(*) as count FROM pipeline').get().count,
      contratti: db.prepare('SELECT COUNT(*) as count FROM contratti').get().count,
      chiamate: db.prepare('SELECT COUNT(*) as count FROM chiamate').get().count,
      aum: db.prepare('SELECT COUNT(*) as count FROM registro_aum').get().count,
      timeline: db.prepare('SELECT COUNT(*) as count FROM timeline').get().count
    };
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear all data from database
router.post('/clear-database', (req, res) => {
  try {
    const tables = [
      'funnel_settimanale',
      'canali_acquisizione',
      'timeline',
      'chiamate',
      'registro_aum',
      'contratti',
      'pipeline',
      'contatti',
      'configurazione'
    ];

    tables.forEach(table => {
      db.prepare(`DELETE FROM ${table}`).run();
    });

    saveDatabase();
    res.json({ success: true, message: 'Database cleared successfully' });
  } catch (error) {
    console.error('Clear database error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset database with seed data
router.post('/reset-database', async (req, res) => {
  try {
    // Clear tables first
    const tables = [
      'funnel_settimanale',
      'canali_acquisizione',
      'timeline',
      'chiamate',
      'registro_aum',
      'contratti',
      'pipeline',
      'contatti',
      'configurazione'
    ];

    tables.forEach(table => {
      db.prepare(`DELETE FROM ${table}`).run();
    });

    // Insert seed data
    const seedData = require('../scripts/seed-data-inline');
    seedData.seed(db);

    saveDatabase();
    res.json({ success: true, message: 'Database reset with demo data' });
  } catch (error) {
    console.error('Reset database error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
