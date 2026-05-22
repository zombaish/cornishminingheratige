const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const { createBareServer } = require('@tomphttp/bare-server-node');
const http = require('http');

const app = express();
const server = http.createServer(app);
const bare = createBareServer('/bare/');

// Setup session middleware for security tracking
app.use(session({
    secret: 'mining-heritage-key-2026',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS on production
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static CSS directly
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'style.css'));
});

// 1. Public Homepage Router
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 2. Gateway Router
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Form evaluation processor
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const emailHash = crypto.createHash('sha256').update(email || '').digest('hex');
    const passHash = crypto.createHash('sha256').update(password || '').digest('hex');

    // SHA-256 validation prevents standard source inspection exposure
    if (emailHash === '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b' && 
        passHash === '6030c6a51d4eb611db84589d892795ecdbba62bc6e70eb1eaab61cdab5720027') {
        req.session.authenticated = true;
        res.redirect('/secret');
    } else {
        res.redirect('/login?error=failed');
    }
});

// 3. Protected Terminal Router
app.get('/secret', (req, res) => {
    if (!req.session.authenticated) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'secret.html'));
});

// Bind Ultraviolet reverse routing handler to bare network sockets
server.on('request', (req, res) => {
    if (bare.shouldRoute(req)) {
        bare.route(req, res);
    } else {
        app(req, res);
    }
});

server.on('upgrade', (req, socket, head) => {
    if (bare.shouldRoute(req)) {
        bare.routeUpgrade(req, socket, head);
    } else {
        socket.end();
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server executing active tunnel allocation on port ${PORT}`);
});
