export class NotificationDTO {
  public title = '';
  public content = '';
  public icon = '';
  public action = '';
  public notification_type = '';
  public game_id = 0;
  public validity = 20;
  public usernames!: string[];
  public user_ids!: number[];
}

export class Notification extends NotificationDTO {
  constructor(data?: NotificationDTO) {
    super();
    Object.assign(this, data || new NotificationDTO());
  }
}
