
export interface IPermission {
  Id: string;
  Nom: string;
  Description: string;
  ApplicationId: string;
}

export class PermissionDTO implements IPermission{
  public Id: string = '';
  public Nom: string = '';
  public Description: string = '';
  public ApplicationId: string = '';
}

export class Permission extends PermissionDTO {
  constructor(dto?: PermissionDTO){
    super();
    Object.assign(this, dto || new PermissionDTO());
  }
}