export class FriendshipDTO {
  public id = 0;
  public user_id = 0;
  public user_username = '';
  public friend_id = 0;
  public friend_username = '';
  public status = '';
  public subscribed = false;
  public username = '';
}

export class Friendship extends FriendshipDTO {
  constructor(data?: FriendshipDTO) {
    super();
    Object.assign(this, data || new FriendshipDTO());
  }
}
