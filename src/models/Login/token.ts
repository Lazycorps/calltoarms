import { JsonObject, JsonProperty } from "json2typescript";

@JsonObject("Token")
export class TokenDTO {
  @JsonProperty("user_id", Number)
  public user_id: number = 0;
  @JsonProperty("exp", Number)
  public exp: number = 0;
  @JsonProperty("iat", Number)
  public iat: number = 0;
  @JsonProperty("username", String)
  public username: string = '';
}

export class Token extends TokenDTO{
  constructor(data?: TokenDTO){
    super();
    Object.assign(this, data || new TokenDTO());
  }
}