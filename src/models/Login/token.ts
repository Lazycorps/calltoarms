import { JsonObject, JsonProperty } from 'json2typescript';

@JsonObject('Token')
export class TokenDTO {
  @JsonProperty('user_id', Number)
  public user_id = 0;
  @JsonProperty('exp', Number)
  public exp = 0;
  @JsonProperty('iat', Number)
  public iat = 0;
  @JsonProperty('username', String)
  public username = '';
  @JsonProperty('is_admin', Boolean, true)
  public is_admin = false;
}

export class Token extends TokenDTO {
  constructor(data?: TokenDTO) {
    super();
    Object.assign(this, data || new TokenDTO());
  }
}
