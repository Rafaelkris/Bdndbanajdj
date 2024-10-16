const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// File path for storing private server links
const DATA_FILE = path.join(__dirname, 'private_servers.json');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Load existing private server links from the JSON file
const loadPrivateServers = () => {
    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE);
        return JSON.parse(data);
    }
    return {};
};

// Save private server links to the JSON file
const savePrivateServers = (servers) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(servers, null, 2));
};

// Initialize the private_servers object with existing data
let privateServers = loadPrivateServers();

// Route to add a private server link
app.post('/api/add', (req, res) => {
    const link = req.body.link;
    if (link) {
        const gameId = link.split('/games/')[1]?.split('?')[0];
        if (gameId) {
            if (!privateServers[gameId]) {
                privateServers[gameId] = [];
            }
            if (!privateServers[gameId].includes(link)) {
                privateServers[gameId].push(link);
                savePrivateServers(privateServers);
            }
            return res.json({ message: "Private server link added successfully.", game_id: gameId, links: privateServers[gameId] });
        } else {
            return res.status(400).json({ error: "Invalid link format." });
        }
    } else {
        return res.status(400).json({ error: "No link provided." });
    }
});

// Form page for adding a private server link
app.get('/api/add', (req, res) => {
    res.send(`
        <h1>Add Private Server Link</h1>
        <form method="post" action="/api/add">
            <label for="link">Enter Private Server Link:</label>
            <input type="text" id="link" name="link" required>
            <button type="submit">Add Link</button>
        </form>
    `);
});

// Route to retrieve a private server link for a specific game
app.get('/api/privateserver', (req, res) => {
    const gameId = req.query.id;
    if (gameId) {
        if (privateServers[gameId]) {
            return res.json({ game_id: gameId, links: privateServers[gameId] });
        } else {
            return res.status(404).json({ error: `No private server found for Game ID: ${gameId}` });
        }
    } else {
        return res.status(400).json({ error: "Please provide a valid game ID in the 'id' parameter." });
    }
});

// Route to count private servers and unique game IDs
app.get('/api/countps', (req, res) => {
    const totalLinks = Object.values(privateServers).reduce((acc, links) => acc + links.length, 0);
    const totalGameIds = Object.keys(privateServers).length;
    const gameIdsList = Object.keys(privateServers);
    
    return res.json({
        total_game_ids: totalGameIds,
        total_ps_links: totalLinks,
        game_ids: gameIdsList
    });
});

// Home route with available API routes information
app.get('/', (req, res) => {
    const routesInfo = {
        "/api/add": "POST - Add a private server link. Requires 'link' parameter with the server link.",
        "/api/privateserver": "GET - Retrieve a private server link for a specific game. Requires 'id' parameter with the game ID.",
        "/api/countps": "GET - Returns the count of private server links and unique game IDs."
    };
    return res.json({
        message: "Available API routes",
        routes: routesInfo
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
