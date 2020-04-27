
 import { Permission } from "./permission";

export class UtilisateurDTO {
  public ID: string = '';
  public NomPrenom: string = '';
  public Permissions: Permission[] = [];
}

export class Utilisateur extends UtilisateurDTO{
  constructor(data?: UtilisateurDTO){
    super();
    Object.assign(this, data || new UtilisateurDTO());
  }
}