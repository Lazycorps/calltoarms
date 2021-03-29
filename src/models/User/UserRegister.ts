export class UserRegisterDTO {
  public username = '';
  public email = '';
  public password = '';
}

export class UserRegister extends UserRegisterDTO {
  constructor(data?: UserRegisterDTO) {
    super();
    Object.assign(this, data || new UserRegisterDTO());
  }
}
