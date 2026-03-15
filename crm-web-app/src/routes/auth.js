/**
 * Authentication Routes - Google OAuth Login
 */

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');

// OAuth2 Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// Email autorizzate per il login (aggiungi le tue)
const AUTHORIZED_EMAILS = (process.env.AUTHORIZED_EMAILS || '').split(',').filter(e => e);

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

// Funzione per ottenere l'URL base dalla richiesta
function getBaseUrl(req) {
  // Usa BASE_URL se configurato, altrimenti rileva dalla richiesta
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
  const host = req.get('x-forwarded-host') || req.get('host');
  return `${protocol}://${host}`;
}

// Funzione per creare oauth2Client con redirect URI dinamico
function createOAuth2Client(redirectUri) {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

// GET /auth/login - Pagina di login
router.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/');
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login - CRM Antonio Tritto</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-container {
          background: #1e1e2e;
          border-radius: 16px;
          padding: 48px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 400px;
          width: 90%;
        }
        .logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 32px;
          font-weight: 700;
          color: white;
        }
        h1 {
          color: #fff;
          font-size: 24px;
          margin-bottom: 8px;
        }
        p {
          color: #888;
          margin-bottom: 32px;
        }
        .google-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: #4285f4;
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s;
        }
        .google-btn:hover {
          background: #3367d6;
        }
        .google-btn svg {
          width: 20px;
          height: 20px;
        }
        .error {
          background: #ff4757;
          color: white;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
      </style>
    </head>
    <body>
      <div class="login-container">
        <div class="logo">AT</div>
        <h1>CRM Antonio Tritto</h1>
        <p>Private Banking Dashboard</p>
        ${req.query.error ? `<div class="error">${req.query.error}</div>` : ''}
        <a href="/auth/google" class="google-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Accedi con Google
        </a>
      </div>
    </body>
    </html>
  `);
});

// GET /auth/google - Redirect a Google OAuth
router.get('/google', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/auth/google/callback`;
  const oauth2Client = createOAuth2Client(redirectUri);

  // Salva il redirect URI in sessione per il callback
  req.session.oauth_redirect_uri = redirectUri;

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'select_account'
  });
  res.redirect(authUrl);
});

// GET /auth/google/callback - Callback da Google
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect('/auth/login?error=Accesso negato');
  }

  if (!code) {
    return res.redirect('/auth/login?error=Codice mancante');
  }

  try {
    // Usa il redirect URI salvato in sessione o rileva dalla richiesta
    const baseUrl = getBaseUrl(req);
    const redirectUri = req.session.oauth_redirect_uri || `${baseUrl}/auth/google/callback`;
    const oauth2Client = createOAuth2Client(redirectUri);

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Ottieni info utente
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const email = userInfo.data.email;
    const name = userInfo.data.name;
    const picture = userInfo.data.picture;

    // Verifica se l'email è autorizzata (se la lista è configurata)
    if (AUTHORIZED_EMAILS.length > 0 && !AUTHORIZED_EMAILS.includes(email)) {
      return res.redirect('/auth/login?error=Email non autorizzata');
    }

    // Salva sessione
    req.session.user = {
      email,
      name,
      picture,
      loggedInAt: new Date().toISOString()
    };

    console.log(`✅ Login: ${email}`);
    res.redirect('/');

  } catch (err) {
    console.error('Errore login:', err);
    res.redirect('/auth/login?error=Errore durante il login');
  }
});

// GET /auth/logout - Logout
router.get('/logout', (req, res) => {
  const user = req.session?.user?.email || 'unknown';
  req.session.destroy((err) => {
    console.log(`👋 Logout: ${user}`);
    res.redirect('/auth/login');
  });
});

// GET /auth/user - Info utente corrente (API)
router.get('/user', (req, res) => {
  if (req.session && req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Non autenticato' });
  }
});

// Middleware per proteggere le route
function requireAuth(req, res, next) {
  // Escludi le route pubbliche
  const publicPaths = ['/auth/', '/css/', '/js/', '/images/', '/favicon'];
  const isPublic = publicPaths.some(p => req.path.startsWith(p));

  if (isPublic) {
    return next();
  }

  if (req.session && req.session.user) {
    return next();
  }

  // Se è una richiesta API, ritorna 401
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  // Altrimenti redirect al login
  res.redirect('/auth/login');
}

module.exports = { router, requireAuth };
