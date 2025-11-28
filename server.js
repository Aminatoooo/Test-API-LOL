require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const RIOT_API_KEY = process.env.RIOT_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Riot API base URLs
const RIOT_ACCOUNT_API = 'https://europe.api.riotgames.com';
const RIOT_EUW_API = 'https://euw1.api.riotgames.com';

// Helper function to make Riot API requests
async function riotApiRequest(url) {
    const response = await fetch(url, {
        headers: {
            'X-Riot-Token': RIOT_API_KEY
        }
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw { status: response.status, message: error.status?.message || 'API Error' };
    }
    
    return response.json();
}

// Get account by Riot ID (gameName#tagLine)
app.get('/api/account/:gameName/:tagLine', async (req, res) => {
    try {
        const { gameName, tagLine } = req.params;
        const accountData = await riotApiRequest(
            `${RIOT_ACCOUNT_API}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
        );
        res.json(accountData);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message || 'Server error' });
    }
});

// Get summoner info by PUUID
app.get('/api/summoner/:puuid', async (req, res) => {
    try {
        const { puuid } = req.params;
        const summonerData = await riotApiRequest(
            `${RIOT_EUW_API}/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`
        );
        res.json(summonerData);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message || 'Server error' });
    }
});

// Get ranked stats by summoner ID
app.get('/api/ranked/:summonerId', async (req, res) => {
    try {
        const { summonerId } = req.params;
        const rankedData = await riotApiRequest(
            `${RIOT_EUW_API}/lol/league/v4/entries/by-summoner/${encodeURIComponent(summonerId)}`
        );
        res.json(rankedData);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message || 'Server error' });
    }
});

// Get match history by PUUID
app.get('/api/matches/:puuid', async (req, res) => {
    try {
        const { puuid } = req.params;
        const count = req.query.count || 10;
        const matchIds = await riotApiRequest(
            `${RIOT_ACCOUNT_API}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?count=${count}`
        );
        res.json(matchIds);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message || 'Server error' });
    }
});

// Get match details by match ID
app.get('/api/match/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;
        const matchData = await riotApiRequest(
            `${RIOT_ACCOUNT_API}/lol/match/v5/matches/${encodeURIComponent(matchId)}`
        );
        res.json(matchData);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message || 'Server error' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
