export class GameDTO {
  public id = 0;
  public title = '';
  public image_url = '';
  public created_at = '';
  public updated_at = '';
  public is_favorited_by_user = false;
  public default_message = '';
}

export class Game extends GameDTO {
  constructor(data?: GameDTO) {
    super();
    Object.assign(this, data || new GameDTO());
  }
}
