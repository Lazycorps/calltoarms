export class GameDTO {
  id = 0;
  name = "";
  cover: GameCoverDTO = new GameCoverDTO();
}

export class GameCoverDTO {
  id = 0;
  url = "";
}
