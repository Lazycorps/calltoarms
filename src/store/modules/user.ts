import { Module, VuexModule, Mutation, Action, getModule } from 'vuex-module-decorators'
import axios from 'axios'
import { Token } from '@/models/Login/token';
import store from '@/store/index';
import { Utilisateur } from '@/models/Login/utilisateur';
import { UserRegister } from '@/models/User/UserRegister';

export interface IUserState {
  token: string,
  username: string,
  expire: string,
  status: string,
  utilisateur: Utilisateur
}

@Module({ dynamic: true, store, name: 'user' })
class User extends VuexModule implements IUserState {

  public token: string = localStorage.getItem("user-token") || "";
  public expire: string = localStorage.getItem("token-expire") || "";
  public status: string = '';
  public utilisateur: Utilisateur = new Utilisateur();
  public username: string = '';

  @Mutation
  private SET_TOKEN(token: string): void {
    localStorage.setItem("user-token", token);
    this.token = token;
    this.status = "success";
  };

  @Mutation
  private SET_USER(user: Utilisateur): void {
    this.utilisateur = user;
    this.username = user.NomPrenom;
  };

  @Mutation
  private LOGIN_FAIL(): void {
    this.status = "error";
  };

  @Mutation
  private RESET_TOKEN(): void {
    localStorage.removeItem("user-token");
    this.token = "";
    localStorage.removeItem("token-expire");
    this.expire = "";
  };

  @Action({rawError: true})
  public Login(userInfo: { username: string, password: string }): Promise<any> {
    return new Promise((resolve, reject) => {
      let user : {email: string, password: string} =  {email: userInfo.username, password: userInfo.password};
      axios.post('https://api.iplaybitch.cornet.dev/api/v1/users/sign_in', user)
        .then((resp) => {
          let token = resp.headers['access-token'];
          this.SET_TOKEN(token);
          resolve(resp);
        })
        .catch((err) => {
          this.LOGIN_FAIL();
          let errorMessage: string = "Impossible de se connecter au serveur d'authentification";
          if (err.response && err.response.status === 400) {
            errorMessage = err.response.data.Message;
          };
          reject(errorMessage);
        });
    });
  }

  @Action({rawError: true})
  public Register(userInfo: UserRegister): Promise<any> {
    return new Promise((resolve, reject) => {
      axios.post<Token>("https://api.iplaybitch.cornet.dev/api/v1/users/sign_up", userInfo)
        .then((resp) => {
          //this.SET_TOKEN(resp.data);
          resolve(resp);
        })
        .catch((err) => {
          //this.LOGIN_FAIL();
          let errorMessage: string = "Impossible de se connecter au serveur d'authentification";
          if (err.response && err.response.status === 400) {
            errorMessage = err.response.data.Message;
          };
          reject(errorMessage);
        });
    });
  }

  @Action
  public Logout() {
    this.RESET_TOKEN();
  }
}

export const UserModule = getModule(User);