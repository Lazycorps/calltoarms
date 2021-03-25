import { Game } from '../Game/game';
import { NotificationReceived } from '../Notification/notificationReceived';
import { Friendship } from '../Friend/friendship';

export class UtilisateurDTO {
  public id = 0;
  public email = '';
  public username = '';
  // public friends: Friend[]= [];
  // public followers: Friend[]= [];
  public friendships: Friendship[] = [];
  public friendships_requests: Friendship[] = [];
  public games: Game[] = [];
  public notifications_received: NotificationReceived[] = [];
}

export class Utilisateur extends UtilisateurDTO {
  constructor(data?: UtilisateurDTO) {
    super();
    Object.assign(this, data || new UtilisateurDTO());
  }
}
