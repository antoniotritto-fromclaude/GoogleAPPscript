/**
 * Authentication Routes - Google OAuth + Email/Password Login
 */

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// OAuth2 Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// Email autorizzate per il login (aggiungi le tue)
const AUTHORIZED_EMAILS = (process.env.AUTHORIZED_EMAILS || '').split(',').filter(e => e);

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

// File per salvare gli utenti registrati
const USERS_FILE = path.join(__dirname, '../../data/users.json');

// Assicura che la directory data esista
function ensureDataDir() {
  const dataDir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Carica utenti dal file
function loadUsers() {
  ensureDataDir();
  if (fs.existsSync(USERS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

// Salva utenti nel file
function saveUsers(users) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Funzione per ottenere l'URL base dalla richiesta
function getBaseUrl(req) {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  const host = req.get('x-forwarded-host') || req.get('host');

  if (host && (host.includes('.onrender.com') || host.includes('.herokuapp.com') || host.includes('.vercel.app'))) {
    return `https://${host}`;
  }

  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
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

// Stili CSS comuni per le pagine di auth
const authStyles = `
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
    padding: 40px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    max-width: 420px;
    width: 90%;
  }
  .logo {
    width: 70px;
    height: 70px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    font-size: 28px;
    font-weight: 700;
    color: white;
  }
  h1 {
    color: #fff;
    font-size: 22px;
    margin-bottom: 6px;
  }
  .subtitle {
    color: #888;
    margin-bottom: 24px;
    font-size: 14px;
  }
  .divider {
    display: flex;
    align-items: center;
    margin: 24px 0;
    color: #666;
    font-size: 13px;
  }
  .divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #333;
  }
  .divider span {
    padding: 0 16px;
  }
  .form-group {
    margin-bottom: 16px;
    text-align: left;
  }
  .form-group label {
    display: block;
    color: #aaa;
    font-size: 13px;
    margin-bottom: 6px;
  }
  .form-group input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #333;
    border-radius: 8px;
    background: #2a2a3e;
    color: #fff;
    font-size: 15px;
    transition: border-color 0.2s;
  }
  .form-group input:focus {
    outline: none;
    border-color: #667eea;
  }
  .google-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: #4285f4;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s;
    width: 100%;
  }
  .google-btn:hover {
    background: #3367d6;
  }
  .google-btn svg {
    width: 18px;
    height: 18px;
  }
  .submit-btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
    margin-top: 8px;
  }
  .submit-btn:hover {
    opacity: 0.9;
  }
  .error {
    background: rgba(255, 71, 87, 0.2);
    border: 1px solid #ff4757;
    color: #ff6b7a;
    padding: 10px 14px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
  }
  .success {
    background: rgba(46, 213, 115, 0.2);
    border: 1px solid #2ed573;
    color: #7bed9f;
    padding: 10px 14px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
  }
  .link {
    color: #667eea;
    text-decoration: none;
    font-size: 14px;
  }
  .link:hover {
    text-decoration: underline;
  }
  .footer-text {
    margin-top: 20px;
    color: #666;
    font-size: 14px;
  }
  .tabs {
    display: flex;
    margin-bottom: 24px;
    background: #2a2a3e;
    border-radius: 8px;
    padding: 4px;
  }
  .tab {
    flex: 1;
    padding: 10px;
    text-align: center;
    color: #888;
    text-decoration: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }
  .tab.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  .tab:hover:not(.active) {
    color: #fff;
  }
`;

// GET /auth/login - Pagina di login
router.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/');
  }

  const error = req.query.error || '';
  const success = req.query.success || '';

  res.send(`
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login - CRM Antonio Tritto</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>${authStyles}</style>
    </head>
    <body>
      <div class="login-container">
        <div class="logo">AT</div>
        <h1>CRM Antonio Tritto</h1>
        <p class="subtitle">Private Banking Dashboard</p>

        <div class="tabs">
          <a href="/auth/login" class="tab active">Accedi</a>
          <a href="/auth/register" class="tab">Registrati</a>
        </div>

        ${error ? `<div class="error">${error}</div>` : ''}
        ${success ? `<div class="success">${success}</div>` : ''}

        <form action="/auth/login" method="POST">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required placeholder="tua@email.com">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required placeholder="La tua password">
          </div>
          <button type="submit" class="submit-btn">Accedi</button>
        </form>

        <div class="divider"><span>oppure</span></div>

        <a href="/auth/google" class="google-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Accedi con Google
        </a>

        <p class="footer-text">
          Non hai un account? <a href="/auth/register" class="link">Registrati</a>
        </p>
      </div>
    </body>
    </html>
  `);
});

// GET /auth/register - Pagina di registrazione
router.get('/register', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/');
  }

  const error = req.query.error || '';

  res.send(`
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registrati - CRM Antonio Tritto</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>${authStyles}</style>
    </head>
    <body>
      <div class="login-container">
        <div class="logo">AT</div>
        <h1>Crea il tuo account</h1>
        <p class="subtitle">Registrati per accedere al CRM</p>

        <div class="tabs">
          <a href="/auth/login" class="tab">Accedi</a>
          <a href="/auth/register" class="tab active">Registrati</a>
        </div>

        ${error ? `<div class="error">${error}</div>` : ''}

        <form action="/auth/register" method="POST">
          <div class="form-group">
            <label for="name">Nome completo</label>
            <input type="text" id="name" name="name" required placeholder="Mario Rossi">
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required placeholder="tua@email.com">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required minlength="6" placeholder="Minimo 6 caratteri">
          </div>
          <div class="form-group">
            <label for="confirmPassword">Conferma Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required placeholder="Ripeti la password">
          </div>
          <button type="submit" class="submit-btn">Registrati</button>
        </form>

        <p class="footer-text">
          Hai gia un account? <a href="/auth/login" class="link">Accedi</a>
        </p>
      </div>
    </body>
    </html>
  `);
});

// POST /auth/register - Registrazione utente
router.post('/register', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  // Validazioni
  if (!name || !email || !password || !confirmPassword) {
    return res.redirect('/auth/register?error=' + encodeURIComponent('Tutti i campi sono obbligatori'));
  }

  if (password !== confirmPassword) {
    return res.redirect('/auth/register?error=' + encodeURIComponent('Le password non coincidono'));
  }

  if (password.length < 6) {
    return res.redirect('/auth/register?error=' + encodeURIComponent('La password deve avere almeno 6 caratteri'));
  }

  // Verifica email valida
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.redirect('/auth/register?error=' + encodeURIComponent('Email non valida'));
  }

  try {
    const users = loadUsers();

    // Verifica se l'email esiste gia
    if (users[email.toLowerCase()]) {
      return res.redirect('/auth/register?error=' + encodeURIComponent('Email gia registrata'));
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Salva utente
    users[email.toLowerCase()] = {
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    saveUsers(users);

    console.log(`Nuovo utente registrato: ${email}`);
    res.redirect('/auth/login?success=' + encodeURIComponent('Registrazione completata! Ora puoi accedere.'));

  } catch (err) {
    console.error('Errore registrazione:', err);
    res.redirect('/auth/register?error=' + encodeURIComponent('Errore durante la registrazione'));
  }
});

// POST /auth/login - Login con email/password
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.redirect('/auth/login?error=' + encodeURIComponent('Email e password sono obbligatori'));
  }

  try {
    const users = loadUsers();
    const user = users[email.toLowerCase()];

    if (!user) {
      return res.redirect('/auth/login?error=' + encodeURIComponent('Email o password non corretti'));
    }

    // Verifica password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.redirect('/auth/login?error=' + encodeURIComponent('Email o password non corretti'));
    }

    // Verifica se l'email e autorizzata (se la lista e configurata)
    if (AUTHORIZED_EMAILS.length > 0 && !AUTHORIZED_EMAILS.includes(user.email)) {
      return res.redirect('/auth/login?error=' + encodeURIComponent('Email non autorizzata'));
    }

    // Salva sessione
    req.session.user = {
      email: user.email,
      name: user.name,
      picture: null,
      authMethod: 'email',
      loggedInAt: new Date().toISOString()
    };

    console.log(`Login (email): ${user.email}`);
    res.redirect('/');

  } catch (err) {
    console.error('Errore login:', err);
    res.redirect('/auth/login?error=' + encodeURIComponent('Errore durante il login'));
  }
});

// GET /auth/google - Redirect a Google OAuth
router.get('/google', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/auth/google/callback`;
  const oauth2Client = createOAuth2Client(redirectUri);

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

  console.log('OAuth callback ricevuto');

  if (error) {
    return res.redirect('/auth/login?error=' + encodeURIComponent('Accesso negato: ' + error));
  }

  if (!code) {
    return res.redirect('/auth/login?error=' + encodeURIComponent('Codice mancante'));
  }

  try {
    const baseUrl = getBaseUrl(req);
    const redirectUri = req.session.oauth_redirect_uri || `${baseUrl}/auth/google/callback`;

    const oauth2Client = createOAuth2Client(redirectUri);

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const email = userInfo.data.email;
    const name = userInfo.data.name;
    const picture = userInfo.data.picture;

    // Verifica se l'email e autorizzata (se la lista e configurata)
    if (AUTHORIZED_EMAILS.length > 0 && !AUTHORIZED_EMAILS.includes(email)) {
      return res.redirect('/auth/login?error=' + encodeURIComponent('Email non autorizzata'));
    }

    // Salva sessione
    req.session.user = {
      email,
      name,
      picture,
      authMethod: 'google',
      loggedInAt: new Date().toISOString()
    };

    console.log(`Login (Google): ${email}`);
    res.redirect('/');

  } catch (err) {
    console.error('Errore login Google:', err.message);
    res.redirect('/auth/login?error=' + encodeURIComponent(err.message || 'Errore durante il login'));
  }
});

// GET /auth/logout - Logout
router.get('/logout', (req, res) => {
  const user = req.session?.user?.email || 'unknown';
  req.session.destroy((err) => {
    console.log(`Logout: ${user}`);
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
  const publicPaths = ['/auth/', '/css/', '/js/', '/images/', '/favicon'];
  const isPublic = publicPaths.some(p => req.path.startsWith(p));

  if (isPublic) {
    return next();
  }

  if (req.session && req.session.user) {
    return next();
  }

  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  res.redirect('/auth/login');
}

module.exports = { router, requireAuth };
