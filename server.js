require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Validate API key on startup
if (!RIOT_API_KEY) {
    console.warn('Warning: RIOT_API_KEY environment variable is not set. API requests will fail.');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Regional API endpoints mapping
const REGIONAL_APIS = {
    'europe': 'https://europe.api.riotgames.com',
    'americas': 'https://americas.api.riotgames.com',
    'asia': 'https://asia.api.riotgames.com',
    'sea': 'https://sea.api.riotgames.com'
};

const PLATFORM_APIS = {
    'euw1': 'https://euw1.api.riotgames.com',
    'eun1': 'https://eun1.api.riotgames.com',
    'na1': 'https://na1.api.riotgames.com',
    'kr': 'https://kr.api.riotgames.com',
    'jp1': 'https://jp1.api.riotgames.com',
    'br1': 'https://br1.api.riotgames.com',
    'la1': 'https://la1.api.riotgames.com',
    'la2': 'https://la2.api.riotgames.com',
    'oc1': 'https://oc1.api.riotgames.com',
    'tr1': 'https://tr1.api.riotgames.com',
    'ru': 'https://ru.api.riotgames.com',
    'ph2': 'https://ph2.api.riotgames.com',
    'sg2': 'https://sg2.api.riotgames.com',
    'th2': 'https://th2.api.riotgames.com',
    'tw2': 'https://tw2.api.riotgames.com',
    'vn2': 'https://vn2.api.riotgames.com'
};

// Default region configuration
const DEFAULT_REGION = process.env.DEFAULT_REGION || 'europe';
const DEFAULT_PLATFORM = process.env.DEFAULT_PLATFORM || 'euw1';

// Helper function to get regional API URL
function getRegionalApi(region) {
    return REGIONAL_APIS[region] || REGIONAL_APIS[DEFAULT_REGION];
}

// Helper function to get platform API URL
function getPlatformApi(platform) {
    return PLATFORM_APIS[platform] || PLATFORM_APIS[DEFAULT_PLATFORM];
}

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
        const region = req.query.region || DEFAULT_REGION;
        const regionalApi = getRegionalApi(region);
        const accountData = await riotApiRequest(
            `${regionalApi}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
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
        const platform = req.query.platform || DEFAULT_PLATFORM;
        const platformApi = getPlatformApi(platform);
        const summonerData = await riotApiRequest(
            `${platformApi}/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`
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
        const platform = req.query.platform || DEFAULT_PLATFORM;
        const platformApi = getPlatformApi(platform);
        const rankedData = await riotApiRequest(
            `${platformApi}/lol/league/v4/entries/by-summoner/${encodeURIComponent(summonerId)}`
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
        const region = req.query.region || DEFAULT_REGION;
        const regionalApi = getRegionalApi(region);
        const count = req.query.count || 10;
        const matchIds = await riotApiRequest(
            `${regionalApi}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?count=${count}`
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
        const region = req.query.region || DEFAULT_REGION;
        const regionalApi = getRegionalApi(region);
        const matchData = await riotApiRequest(
            `${regionalApi}/lol/match/v5/matches/${encodeURIComponent(matchId)}`
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
