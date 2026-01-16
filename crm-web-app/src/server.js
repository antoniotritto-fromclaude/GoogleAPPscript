/**
 * CRM Antonio Tritto - Server Principale
 * Sistema CRM per Ecosistema Acquisizione Clienti
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:"]
    }
  }
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Errore interno del server',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Avvio asincrono per inizializzare il database prima delle routes
async function startServer() {
  try {
    // Inizializza database
    const { initDatabase } = require('./models/database');
    await initDatabase();
    console.log('✅ Database pronto');

    // Carica routes dopo l'inizializzazione del database
    const dashboardRoutes = require('./routes/dashboard');
    const contattiRoutes = require('./routes/contatti');
    const pipelineRoutes = require('./routes/pipeline');
    const contrattiRoutes = require('./routes/contratti');
    const aumRoutes = require('./routes/aum');
    const chiamateRoutes = require('./routes/chiamate');
    const analyticsRoutes = require('./routes/analytics');

    // API Routes
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/contatti', contattiRoutes);
    app.use('/api/pipeline', pipelineRoutes);
    app.use('/api/contratti', contrattiRoutes);
    app.use('/api/aum', aumRoutes);
    app.use('/api/chiamate', chiamateRoutes);
    app.use('/api/analytics', analyticsRoutes);

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║     🎯 CRM Antonio Tritto - Private Banking                ║
║     Server avviato su http://localhost:${PORT}               ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

  } catch (error) {
    console.error('❌ Errore avvio server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
