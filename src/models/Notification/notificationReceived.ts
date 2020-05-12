

export class NotificationReceivedDTO {
  public content= "";
  public created_at= "";
  public deleted_at = "";
  public game_id = 0;;
  public id= 0;
  public notification_type = "";
  public receiver_id = 0;
  public response = "";
  public sender_id= 0;
  public title= "";
  public updated_at= "";
  public validity = 15;
  public expired = false;
}

export class NotificationReceived extends NotificationReceivedDTO {
  constructor(data?: NotificationReceivedDTO) {
    super();
    Object.assign(this, data || new NotificationReceivedDTO());
  }
}