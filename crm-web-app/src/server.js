/**
 * CRM Antonio Tritto - Server Principale
 * Sistema CRM per Ecosistema Acquisizione Clienti
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Necessario per Render/proxy HTTPS
app.set('trust proxy', 1);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'crm-antonio-tritto-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 giorni
  }
}));

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:", "*.googleusercontent.com", "lh3.googleusercontent.com"],
      connectSrc: ["'self'", "cdn.jsdelivr.net", "accounts.google.com"],
      frameSrc: ["'self'", "accounts.google.com"]
    }
  }
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

    // Auth routes (pubbliche)
    const { router: authRoutes, requireAuth } = require('./routes/auth');
    app.use('/auth', authRoutes);

    // Applica middleware di autenticazione
    app.use(requireAuth);

    // Serve static files (dopo auth per proteggere tutto)
    app.use(express.static(path.join(__dirname, '../public')));

    // Carica routes dopo l'inizializzazione del database
    const dashboardRoutes = require('./routes/dashboard');
    const contattiRoutes = require('./routes/contatti');
    const pipelineRoutes = require('./routes/pipeline');
    const contrattiRoutes = require('./routes/contratti');
    const aumRoutes = require('./routes/aum');
    const chiamateRoutes = require('./routes/chiamate');
    const analyticsRoutes = require('./routes/analytics');
    const adminRoutes = require('./routes/admin');
    const interazioniRoutes = require('./routes/interazioni');
    const emailRoutes = require('./routes/email');

    // API Routes
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/contatti', contattiRoutes);
    app.use('/api/pipeline', pipelineRoutes);
    app.use('/api/contratti', contrattiRoutes);
    app.use('/api/aum', aumRoutes);
    app.use('/api/chiamate', chiamateRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/interazioni', interazioniRoutes);
    app.use('/api/email', emailRoutes);

    // Serve main page
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

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
