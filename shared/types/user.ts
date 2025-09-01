import { UserProfile } from "./userProfile";

export class UserDTO {
  id = "";
  name = "";
  admin? = false;
  profile? = new UserProfile()
}
