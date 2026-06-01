# IPTV Player

Application web complète de lecteur IPTV avec gestion de playlists M3U/M3U8, navigation par catégories, favoris et player HLS intégré.

![Stack](https://img.shields.io/badge/React-18-blue) ![Stack](https://img.shields.io/badge/Node.js-Express-green) ![Stack](https://img.shields.io/badge/SQLite-sql.js-orange) ![Stack](https://img.shields.io/badge/HLS.js-Player-red)

## Fonctionnalités

### Auth & Comptes
- Inscription / connexion (email + mot de passe)
- Authentification JWT avec persistance 7 jours
- Profils utilisateurs

### Playlists
- Ajout de playlists M3U/M3U8 via URL ou upload de fichier
- Gestion de plusieurs playlists simultanément
- Parsing automatique des métadonnées (nom, logo, groupe)
- Rafraîchissement des playlists par URL

### Navigation
- Tri et filtrage par catégories (récupérées depuis la playlist)
- Barre de recherche par nom de chaîne
- Système de favoris par utilisateur

### Player
- Lecteur vidéo intégré avec HLS.js pour les streams HLS
- Contrôles classiques (play/pause, volume, plein écran)
- Reprise automatique en cas de coupure stream (jusqu'à 5 tentatives)

### UI
- Design sombre style Netflix/Plex
- Responsive mobile
- Animations et transitions fluides

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 18 + Tailwind CSS + Vite |
| Backend | Node.js + Express |
| Base de données | SQLite (sql.js) |
| Player | HLS.js |
| Auth | JWT + bcrypt |
| Icons | Lucide React |

## Installation

### Prérequis
- Node.js 18+
- npm

### Setup

```bash
# Cloner le repo
git clone https://github.com/VOTRE_USER/iptv-player.git
cd iptv-player

# Installer les dépendances
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## Démarrage

### Windows (rapide)
Double-cliquez sur `start.bat` — l'application démarre et ouvre le navigateur automatiquement.

### Ligne de commande
```bash
npm run dev
```

Cela démarre :
- Backend sur `http://localhost:3001`
- Frontend sur `http://localhost:5173`

### Production
```bash
# Build le frontend
npm run build

# Démarrer le serveur
npm start
```

## Structure du projet

```
├── backend/
│   ├── src/
│   │   ├── index.js          # Point d'entrée Express
│   │   ├── database.js       # SQLite (sql.js)
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js       # Routes auth
│   │   │   ├── playlists.js  # CRUD playlists
│   │   │   └── channels.js   # Recherche & favoris
│   │   └── utils/
│   │       └── m3uParser.js  # Parser M3U/M3U8
│   └── uploads/              # Fichiers uploadés
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddPlaylistModal.jsx
│   │   │   ├── ChannelGrid.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── VideoPlayer.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── index.html
├── start.bat                  # Démarrage rapide Windows
└── package.json
```

## API Endpoints

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil courant |

### Playlists
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/playlists` | Lister mes playlists |
| POST | `/api/playlists/url` | Ajouter via URL |
| POST | `/api/playlists/file` | Ajouter via fichier |
| DELETE | `/api/playlists/:id` | Supprimer |
| POST | `/api/playlists/:id/refresh` | Rafraîchir |

### Chaînes
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/channels/search` | Rechercher (q, group, playlist_id) |
| GET | `/api/channels/groups` | Lister les catégories |
| GET | `/api/channels/favorites` | Mes favoris |
| POST | `/api/channels/:id/favorite` | Toggle favori |

## Licence

MIT
