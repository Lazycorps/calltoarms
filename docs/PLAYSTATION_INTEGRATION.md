# Intégration PlayStation Network (PSN)

Ce document explique comment configurer et utiliser l'intégration PlayStation Network dans l'application Call to Arms.

## Vue d'ensemble

L'intégration PlayStation permet de :

- Connecter votre compte PlayStation Network
- Synchroniser votre liste de jeux avec trophées
- Récupérer les trophées obtenus pour chaque jeu
- Calculer des statistiques de temps de jeu approximatives

## Prérequis

### 1. Compte PlayStation Network

Vous devez avoir un compte PlayStation Network actif.

### 2. Token NPSSO

L'authentification PlayStation nécessite un token NPSSO (Network Platform Single Sign-On). Ce token est requis car PlayStation n'offre pas d'API publique officielle.

## Configuration

### Étape 1 : Obtenir votre token NPSSO

1. **Connectez-vous à PlayStation.com**

   - Allez sur [https://www.playstation.com/](https://www.playstation.com/)
   - Connectez-vous avec vos identifiants PlayStation

2. **Récupérez votre token NPSSO**
   - Dans le même navigateur (important pour les cookies), visitez : [https://ca.account.sony.com/api/v1/ssocookie](https://ca.account.sony.com/api/v1/ssocookie)
   - Vous verrez une réponse JSON comme : `{ "npsso": "<64 character token>" }`
   - Copiez la valeur du token (64 caractères)

### Étape 2 : Connecter votre compte

1. **Accédez à la page des plateformes**

   - Allez dans "Plateformes de Jeux" dans l'application
   - Cliquez sur "Connecter une plateforme"

2. **Sélectionnez PlayStation**

   - Cliquez sur l'onglet "PlayStation"
   - Remplissez le formulaire :
     - **Nom d'utilisateur** : Votre nom d'utilisateur PlayStation (Online ID)
     - **Token NPSSO** : Le token de 64 caractères obtenu précédemment

3. **Validez la connexion**
   - Cliquez sur "Connecter PlayStation"
   - L'application va authentifier votre compte et récupérer vos informations

## Fonctionnalités

### Synchronisation des jeux

- **Jeux avec trophées** : Récupère tous les jeux pour lesquels vous avez des trophées
- **Informations des jeux** : Nom, icône, plateforme (PS4/PS5)
- **Progression** : Pourcentage de trophées obtenus

### Trophées

- **Types de trophées** : Bronze, Argent, Or, Platine
- **Statut** : Obtenu ou non obtenu
- **Date d'obtention** : Quand le trophée a été débloqué
- **Rareté** : Pourcentage de joueurs ayant obtenu le trophée

### Temps de jeu estimé

Comme l'API PlayStation ne fournit pas directement le temps de jeu, l'application calcule une estimation basée sur :

- Le nombre de trophées obtenus vs total
- Une formule approximative : `(trophées obtenus / trophées totaux) * 100 * 6 minutes`

## Limitations

### API non officielle

- L'intégration utilise l'API PSN non officielle via la bibliothèque `psn-api`
- Sony peut modifier l'API à tout moment
- Les tokens NPSSO expirent après environ 2 mois

### Données limitées

- **Pas de temps de jeu réel** : Seule une estimation est disponible
- **Jeux sans trophées** : Ne sont pas récupérés
- **Statut d'installation** : Non disponible via l'API trophées

### Sécurité

- **Token NPSSO sensible** : Traitez ce token comme un mot de passe
- **Stockage sécurisé** : Les tokens sont chiffrés en base de données
- **Expiration** : Vous devrez renouveler le token périodiquement

## Dépannage

### Erreur d'authentification

- **Vérifiez le token NPSSO** : Assurez-vous qu'il fait bien 64 caractères
- **Token expiré** : Récupérez un nouveau token NPSSO
- **Nom d'utilisateur incorrect** : Vérifiez votre Online ID PlayStation

### Aucun jeu trouvé

- **Profil privé** : Vérifiez que votre profil PlayStation est public
- **Pas de trophées** : Seuls les jeux avec trophées sont récupérés
- **Nouveau compte** : Jouez à quelques jeux pour obtenir des trophées

### Synchronisation lente

- **Nombreux jeux** : La synchronisation peut prendre du temps avec beaucoup de jeux
- **Limite API** : L'API PlayStation a des limites de débit

## Architecture technique

### Service PlayStation

```typescript
// server/utils/gaming-platforms/playstation/PlayStationService.ts
export class PlayStationService extends PlatformService {
  // Authentification avec NPSSO
  async authenticate(credentials: PlayStationCredentials);

  // Synchronisation des jeux
  async syncGames(account: PlatformAccount);

  // Synchronisation des trophées
  async syncAchievements(account: PlatformAccount, gameId: string);
}
```

### Types de données

```typescript
// Credentials d'authentification
interface PlayStationCredentials {
  username: string; // Online ID PlayStation
  npsso: string; // Token NPSSO de 64 caractères
}
```

### Bibliothèque utilisée

- **psn-api** : Interface non officielle pour l'API PlayStation
- **Documentation** : [https://psn-api.achievements.app/](https://psn-api.achievements.app/)

## Sécurité et confidentialité

### Protection des données

- Les tokens NPSSO sont chiffrés en base de données
- Aucun mot de passe PlayStation n'est stocké
- Les données de jeux sont stockées localement

### Permissions

- **Lecture seule** : L'application ne peut que lire vos données
- **Pas de modification** : Aucune modification de votre compte PlayStation
- **Données publiques** : Seules les données publiques de votre profil sont accessibles

## Support

### Problèmes connus

- Les tokens NPSSO expirent régulièrement
- Certains jeux peuvent ne pas apparaître s'ils n'ont pas de trophées
- Les temps de jeu sont des estimations approximatives

### Assistance

Pour toute question ou problème :

1. Vérifiez d'abord cette documentation
2. Consultez les logs d'erreur dans l'application
3. Contactez le support technique

## Mise à jour

### Renouvellement du token

Quand votre token expire :

1. Récupérez un nouveau token NPSSO
2. Allez dans les paramètres de votre compte PlayStation connecté
3. Mettez à jour le token NPSSO
4. Relancez la synchronisation

### Nouvelles fonctionnalités

L'intégration PlayStation sera améliorée au fil du temps avec :

- Meilleure estimation du temps de jeu
- Support de plus de données de profil
- Optimisations de performance
