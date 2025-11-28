# LoL Account Finder 🎮

Un site web permettant de rechercher un compte League of Legends via l'API Riot Games et de consulter ses informations.

## Fonctionnalités

- 🔍 Recherche de compte par Riot ID (Nom#Tag)
- 👤 Affichage des informations du compte (niveau, icône de profil)
- 📊 Statistiques classées (Solo/Duo et Flex)
- 📜 Historique des 10 derniers matchs avec détails

## Prérequis

- Node.js (v18 ou supérieur)
- Une clé API Riot Games (obtenue sur [developer.riotgames.com](https://developer.riotgames.com/))

## Installation

1. Clonez le repository :
```bash
git clone https://github.com/Aminatoooo/Test-API-LOL.git
cd Test-API-LOL
```

2. Installez les dépendances :
```bash
npm install
```

3. Créez un fichier `.env` à la racine du projet :
```bash
cp .env.example .env
```

4. Ajoutez votre clé API Riot Games dans le fichier `.env` :
```
RIOT_API_KEY=votre_cle_api_ici
PORT=3000
```

## Utilisation

1. Démarrez le serveur :
```bash
npm start
```

2. Ouvrez votre navigateur à l'adresse : `http://localhost:3000`

3. Entrez un Riot ID (ex: `Faker#KR1`) et cliquez sur "Rechercher"

## Structure du projet

```
Test-API-LOL/
├── server.js           # Serveur Express (backend)
├── public/
│   ├── index.html      # Page principale
│   ├── style.css       # Styles CSS
│   └── script.js       # JavaScript frontend
├── package.json        # Configuration npm
├── .env.example        # Exemple de configuration
└── README.md           # Documentation
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/account/:gameName/:tagLine` | Récupère les données du compte Riot |
| `GET /api/summoner/:puuid` | Récupère les données du summoner |
| `GET /api/ranked/:summonerId` | Récupère les statistiques classées |
| `GET /api/matches/:puuid` | Récupère l'historique des matchs |
| `GET /api/match/:matchId` | Récupère les détails d'un match |

## Notes importantes

- La clé API Riot Games de développement expire toutes les 24 heures
- L'API est limitée à certaines requêtes par minute/seconde
- Ce site utilise le serveur EUW par défaut

## Licence

ISC

---

*Ce projet n'est pas approuvé par Riot Games et ne reflète pas les vues ou opinions de Riot Games.*