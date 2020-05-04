export class NotificationDTO {
  public title: string = '';
  public content: string = '';
  public icon: string = '';
  public action: string = '';
  public notification_type: string = '';
  public game_id: string = '';
}

export class Notification extends NotificationDTO {
  constructor(data?: NotificationDTO) {
    super();
    Object.assign(this, data || new NotificationDTO());
  }
}