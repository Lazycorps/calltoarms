export class UserRegisterDTO {
  public username = '';
  public email = '';
  public password = '';
  // eslint-disable-next-line camelcase
  public password_confirmation = '';
}

export class UserRegister extends UserRegisterDTO {
  constructor(data?: UserRegisterDTO) {
    super();
    Object.assign(this, data || new UserRegisterDTO());
  }
}
