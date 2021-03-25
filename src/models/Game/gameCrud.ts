export class GameCrudDTO {
  public id = 0;
  public title = '';
  public image_url = '';
  public created_at = '';
  public updated_at = '';
}

export class GameCrud extends GameCrudDTO {
  constructor(data?: GameCrudDTO) {
    super();
    Object.assign(this, data || new GameCrudDTO());
  }
}
