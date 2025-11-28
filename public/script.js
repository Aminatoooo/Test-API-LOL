const API_BASE = '';
const DDRAGON_VERSION = '14.1.1';
const DDRAGON_URL = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}`;

let currentPuuid = null;
let currentSummonerId = null;

// Queue type names in French
const QUEUE_TYPES = {
    420: 'Classée Solo/Duo',
    440: 'Classée Flex',
    400: 'Draft Normal',
    430: 'Blind Normal',
    450: 'ARAM',
    700: 'Clash',
    900: 'ARURF',
    1020: 'One for All',
    1300: 'Nexus Blitz',
    1400: 'Ultimate Spellbook',
    0: 'Personnalisée'
};

// Rank tier names
const RANK_TIERS = {
    'IRON': 'Fer',
    'BRONZE': 'Bronze',
    'SILVER': 'Argent',
    'GOLD': 'Or',
    'PLATINUM': 'Platine',
    'EMERALD': 'Émeraude',
    'DIAMOND': 'Diamant',
    'MASTER': 'Maître',
    'GRANDMASTER': 'Grand Maître',
    'CHALLENGER': 'Challenger'
};

async function searchAccount() {
    const gameName = document.getElementById('gameName').value.trim();
    const tagLine = document.getElementById('tagLine').value.trim();

    if (!gameName || !tagLine) {
        showError('Veuillez entrer un nom de joueur et un tag.');
        return;
    }

    hideError();
    hideResults();
    showLoading();

    try {
        // Step 1: Get account data by Riot ID
        const accountResponse = await fetch(`${API_BASE}/api/account/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
        if (!accountResponse.ok) {
            const error = await accountResponse.json();
            throw new Error(error.error || 'Compte non trouvé');
        }
        const accountData = await accountResponse.json();
        currentPuuid = accountData.puuid;

        // Step 2: Get summoner data
        const summonerResponse = await fetch(`${API_BASE}/api/summoner/${encodeURIComponent(currentPuuid)}`);
        if (!summonerResponse.ok) {
            throw new Error('Impossible de récupérer les données du summoner');
        }
        const summonerData = await summonerResponse.json();
        currentSummonerId = summonerData.id;

        // Step 3: Get ranked data
        const rankedResponse = await fetch(`${API_BASE}/api/ranked/${encodeURIComponent(currentSummonerId)}`);
        const rankedData = rankedResponse.ok ? await rankedResponse.json() : [];

        // Step 4: Get match history
        const matchesResponse = await fetch(`${API_BASE}/api/matches/${encodeURIComponent(currentPuuid)}?count=10`);
        const matchIds = matchesResponse.ok ? await matchesResponse.json() : [];

        // Display account info
        displayAccountInfo(accountData, summonerData);
        
        // Display ranked info
        displayRankedInfo(rankedData);

        // Display match history
        await displayMatchHistory(matchIds, currentPuuid);

        hideLoading();
        showResults();

    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

function displayAccountInfo(accountData, summonerData) {
    const profileIcon = document.getElementById('profileIcon');
    const summonerName = document.getElementById('summonerName');
    const riotId = document.getElementById('riotId');
    const summonerLevel = document.getElementById('summonerLevel');

    profileIcon.src = `${DDRAGON_URL}/img/profileicon/${summonerData.profileIconId}.png`;
    summonerName.textContent = accountData.gameName;
    riotId.textContent = `${accountData.gameName}#${accountData.tagLine}`;
    summonerLevel.textContent = `Niveau ${summonerData.summonerLevel}`;
}

function displayRankedInfo(rankedData) {
    const rankedInfo = document.getElementById('rankedInfo');
    
    if (!rankedData || rankedData.length === 0) {
        rankedInfo.innerHTML = '<div class="no-ranked">Aucune partie classée cette saison</div>';
        return;
    }

    let html = '';
    rankedData.forEach(queue => {
        const queueName = queue.queueType === 'RANKED_SOLO_5x5' ? 'Solo/Duo' : 'Flex';
        const tierFr = RANK_TIERS[queue.tier] || queue.tier;
        const wins = queue.wins;
        const losses = queue.losses;
        const winrate = ((wins / (wins + losses)) * 100).toFixed(1);

        html += `
            <div class="ranked-card">
                <h4>${queueName}</h4>
                <div class="rank-info">
                    <img src="${getRankIcon(queue.tier)}" alt="${queue.tier}" class="rank-icon" onerror="this.style.display='none'">
                    <div class="rank-text">
                        <div class="rank-tier">${tierFr} ${queue.rank}</div>
                        <div class="rank-lp">${queue.leaguePoints} LP</div>
                    </div>
                </div>
                <div class="rank-stats">
                    <span class="wins">${wins}V</span>
                    <span class="losses">${losses}D</span>
                    <span class="winrate">${winrate}%</span>
                </div>
            </div>
        `;
    });

    rankedInfo.innerHTML = html;
}

function getRankIcon(tier) {
    // Using placeholder icons - you can replace with actual rank icons
    const tierLower = tier.toLowerCase();
    return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${tierLower}.png`;
}

async function displayMatchHistory(matchIds, puuid) {
    const matchList = document.getElementById('matchList');
    
    if (!matchIds || matchIds.length === 0) {
        matchList.innerHTML = '<div class="no-ranked">Aucun match récent trouvé</div>';
        return;
    }

    matchList.innerHTML = '<div class="loading"><div class="spinner"></div><p>Chargement des matchs...</p></div>';

    let matchesHtml = '';
    
    // Fetch match details (limit to avoid rate limiting)
    for (const matchId of matchIds.slice(0, 10)) {
        try {
            const matchResponse = await fetch(`${API_BASE}/api/match/${encodeURIComponent(matchId)}`);
            if (!matchResponse.ok) continue;
            
            const matchData = await matchResponse.json();
            const participant = matchData.info.participants.find(p => p.puuid === puuid);
            
            if (!participant) continue;

            const win = participant.win;
            const champion = participant.championName;
            const kills = participant.kills;
            const deaths = participant.deaths;
            const assists = participant.assists;
            const kda = deaths === 0 ? 'Perfect' : ((kills + assists) / deaths).toFixed(2);
            const cs = participant.totalMinionsKilled + participant.neutralMinionsKilled;
            const gold = (participant.goldEarned / 1000).toFixed(1);
            const queueId = matchData.info.queueId;
            const gameMode = QUEUE_TYPES[queueId] || matchData.info.gameMode;
            const gameDuration = Math.floor(matchData.info.gameDuration / 60);
            const gameDate = new Date(matchData.info.gameCreation).toLocaleDateString('fr-FR');

            matchesHtml += `
                <div class="match-card ${win ? 'win' : 'loss'}">
                    <img src="${DDRAGON_URL}/img/champion/${champion}.png" alt="${champion}" class="champion-icon" 
                         onerror="this.src='${DDRAGON_URL}/img/champion/Teemo.png'">
                    <div class="match-info">
                        <h4>${champion}</h4>
                        <span class="match-mode">${gameMode}</span>
                    </div>
                    <div class="match-stats">
                        <div class="kda">${kills} / ${deaths} / ${assists}</div>
                        <div class="kda-ratio">${kda} KDA</div>
                        <div class="cs-gold">${cs} CS • ${gold}k Gold</div>
                    </div>
                    <div class="match-result">
                        <span class="result-badge ${win ? 'win' : 'loss'}">${win ? 'Victoire' : 'Défaite'}</span>
                        <div class="match-time">${gameDuration} min</div>
                        <div class="match-time">${gameDate}</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error fetching match:', matchId, error);
        }
    }

    matchList.innerHTML = matchesHtml || '<div class="no-ranked">Impossible de charger les matchs</div>';
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showResults() {
    document.getElementById('results').classList.remove('hidden');
}

function hideResults() {
    document.getElementById('results').classList.add('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

// Allow search on Enter key
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.search-box input');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchAccount();
            }
        });
    });
});
