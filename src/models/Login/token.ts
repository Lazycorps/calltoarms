export class TokenDTO {
  public value: string = '';
  public expires_in: number = 0;
}

export class Token extends TokenDTO{
  constructor(data?: TokenDTO){
    super();
    Object.assign(this, data || new TokenDTO());
  }
}