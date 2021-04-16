export class GameDTO {
  public id = 0;
  public title = '';
  public cover = '';
  public thumbnail = '';
  public is_favorited_by_user = false;
}

export class Game extends GameDTO {
  constructor(data?: GameDTO) {
    super();
    Object.assign(this, data || new GameDTO());
  }
}
