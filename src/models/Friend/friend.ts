export class FriendDTO {
  public id = 0;
  public email = '';
  public username = '';
}

export class Friend extends FriendDTO {
  constructor(data?: FriendDTO) {
    super();
    Object.assign(this, data || new FriendDTO());
  }
}
