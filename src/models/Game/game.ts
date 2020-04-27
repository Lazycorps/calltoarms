export class GameDTO {
  public name: string = '';
  public img: string = '';
  public thumbnail : string = '';
}

export class Game extends GameDTO{
  constructor(data?: GameDTO){
    super();
    Object.assign(this, data || new GameDTO());
  }
}