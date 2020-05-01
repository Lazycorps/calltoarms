
  export class GameCrudDTO {
    public id: number = 0;
    public title: string = '';
    public image_url: string = '';
    public created_at: string = '';
    public updated_at: string = '';
  }
  
  export class GameCrud extends GameCrudDTO{
    constructor(data?: GameCrudDTO){
      super();
      Object.assign(this, data || new GameCrudDTO());
    }
  }