
 import { Permission } from "./permission";

export class UtilisateurDTO {
  public id: string = '';
  public username: string = '';
  public email: string = '';
  public firebase_token: string = '';
}

export class Utilisateur extends UtilisateurDTO {
  constructor(data?: UtilisateurDTO) {
    super();
    Object.assign(this, data || new UtilisateurDTO());
  }
}