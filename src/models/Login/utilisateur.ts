import { Friend } from '../Friend/friend';

export class UtilisateurDTO {
  public id: string = '';
  public email: string = '';
  public username: string = '';
  public friends: Friend[]= [];
  public followers: Friend[]= [];
}

export class Utilisateur extends UtilisateurDTO {
  constructor(data?: UtilisateurDTO) {
    super();
    Object.assign(this, data || new UtilisateurDTO());
    data?.friends.forEach(f => this.friends.push(new Friend(f)));
  }
}