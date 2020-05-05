export class GameDTO {
  public id: string = '';
  public title: string = '';
  public image_url: string = '';
  public created_at: string = '';
  public updated_at: string = '';
  public is_favorited_by_user: boolean = false;
}

export class Game extends GameDTO{
  constructor(data?: GameDTO){
    super();
    Object.assign(this, data || new GameDTO());
  }
}