const express = require('express');
const http = require('http');
const path = require('path');
const { createBareServer } = require('@tomphttp/bare-server-node');
const { uvPath } = require('@titaniumnetwork-dev/ultraviolet');

// Initialize the Bare Server on the /bare/ route
const bareServer = createBareServer('/bare/');
const app = express();
const server = http.createServer();

const PORT = process.env.PORT || 3000;
const SECRET_PASSCODE = "admin123";

app.use(express.urlencoded({ extended: true }));

// Serve your public folder (where your website is)
app.use(express.static(path.join(__dirname, 'public')));

// Serve the Ultraviolet core files from node_modules
app.use('/uv/', express.static(uvPath));

// Handle the login authentication
app.post('/auth', (req, res) => {
    if (req.body.password === SECRET_PASSCODE) {
        res.sendFile(path.join(__dirname, 'public', 'secret.html'));
    } else {
        res.redirect('/login.html');
    }
});

// Intercept requests: Route to Bare Server if needed, otherwise route to Express
server.on('request', (req, res) => {
    if (bareServer.shouldRoute(req)) {
        bareServer.routeRequest(req, res);
    } else {
        app(req, res);
    }
});

// Intercept WebSocket upgrades (vital for sites that use live connections)
server.on('upgrade', (req, socket, head) => {
    if (bareServer.shouldRoute(req)) {
        bareServer.routeUpgrade(req, socket, head);
    } else {
        socket.end();
    }
});

server.listen(PORT, () => {
    console.log(`System active and listening on port ${PORT}`);
});
