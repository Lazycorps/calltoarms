# Intégration Steam

Ce document explique comment configurer et utiliser l'intégration Steam dans l'application Call to Arms.

## Configuration

### 1. Obtenir une clé API Steam

1. Rendez-vous sur [Steam Web API Key](https://steamcommunity.com/dev/apikey)
2. Connectez-vous avec votre compte Steam
3. Remplissez le formulaire avec le nom de domaine de votre application
4. Copiez la clé API générée

### 2. Configuration des variables d'environnement

Ajoutez la clé API Steam à votre fichier `.env` :

```env
STEAM_API_KEY="votre-cle-api-steam"
```

### 3. Migration de la base de données

Exécutez la migration pour créer les tables nécessaires :

```bash
npx prisma migrate dev
```

## Utilisation

### Connexion d'un compte Steam

1. Accédez à la page "Plateformes de Jeux" (`/user/gaming-platforms`)
2. Cliquez sur "Connecter une plateforme"
3. Sélectionnez l'onglet "Steam"
4. Entrez votre Steam ID (17 chiffres)
5. Cliquez sur "Connecter Steam"

### Comment trouver votre Steam ID

#### Méthode 1 : Via Steam

1. Ouvrez Steam et allez dans votre profil
2. Cliquez sur "Modifier le profil"
3. Dans l'URL personnalisée, vous verrez votre Steam ID

#### Méthode 2 : Via des outils en ligne

1. Utilisez un site comme [steamid.io](https://steamid.io)
2. Entrez votre nom d'utilisateur Steam ou l'URL de votre profil
3. Récupérez le Steam ID 64 (17 chiffres)

### Synchronisation des jeux

Une fois votre compte Steam connecté :

1. Cliquez sur le bouton "Sync" sur votre carte de plateforme Steam
2. L'application récupérera automatiquement :
   - La liste de vos jeux
   - Le temps de jeu pour chaque jeu
   - Les jeux joués récemment
   - Les informations de base des succès

### Fonctionnalités disponibles

- **Liste des jeux** : Visualisez tous vos jeux Steam avec leurs temps de jeu
- **Recherche et tri** : Recherchez et triez vos jeux par nom, temps de jeu, ou dernière fois joué
- **Statistiques** : Consultez vos statistiques globales de jeu
- **Jeux récents** : Voyez les jeux que vous avez joués récemment
- **Synchronisation automatique** : Mettez à jour vos données Steam à tout moment

## Architecture technique

### Modèles de données

L'intégration utilise une architecture générique qui permet d'ajouter facilement d'autres plateformes :

- `PlatformAccount` : Compte utilisateur sur une plateforme
- `PlatformGame` : Jeu sur une plateforme avec temps de jeu
- `PlatformAchievement` : Succès/trophées d'un jeu

### Services

- `SteamService` : Service principal pour l'API Steam
- `PlatformServiceFactory` : Factory pour gérer les différents services de plateformes

### API Endpoints

- `POST /api/platforms/steam/auth` : Connexion d'un compte Steam
- `POST /api/platforms/steam/sync` : Synchronisation des jeux Steam
- `GET /api/platforms/steam/games` : Récupération des jeux Steam
- `GET /api/platforms` : Liste des plateformes connectées

## Limitations

### API Steam

- **Profils privés** : Les profils Steam privés ne peuvent pas être synchronisés
- **Limites de taux** : L'API Steam a des limites de taux (100 000 appels par jour)
- **Données disponibles** : Seules les données publiques sont accessibles

### Données synchronisées

- **Succès** : Les succès sont récupérés mais sans pourcentage de rareté global
- **Temps de jeu** : Le temps de jeu est en minutes (précision limitée)
- **Statut d'installation** : L'API Steam ne fournit pas l'état d'installation

## Dépannage

### Erreurs courantes

#### "Steam user not found"

- Vérifiez que le Steam ID est correct (17 chiffres)
- Assurez-vous que le profil Steam est public

#### "Invalid Steam credentials"

- Le Steam ID doit contenir exactement 17 chiffres
- Utilisez le Steam ID 64, pas le Steam ID 32

#### "Steam API error"

- Vérifiez que la clé API Steam est correcte
- Vérifiez que vous n'avez pas dépassé les limites de taux

### Logs de débogage

Les erreurs sont loggées côté serveur. Consultez les logs de l'application pour plus de détails sur les erreurs d'API Steam.

## Évolutions futures

### Plateformes prévues

- PlayStation Network
- Xbox Live
- Nintendo Switch Online
- Epic Games Store
- GOG Galaxy

### Fonctionnalités prévues

- Synchronisation des succès avec pourcentages de rareté
- Comparaison de bibliothèques entre amis
- Recommandations de jeux basées sur les habitudes
- Statistiques avancées et graphiques
- Notifications de nouveaux succès

## Sécurité

### Données stockées

- **Steam ID** : Stocké en clair (information publique)
- **Clé API** : Stockée côté serveur uniquement
- **Données de jeux** : Stockées en base pour améliorer les performances

### Confidentialité

- Seules les données publiques Steam sont récupérées
- Les utilisateurs peuvent déconnecter leur compte à tout moment
- Les données sont supprimées lors de la déconnexion du compte
