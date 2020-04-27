import { Module, VuexModule, Mutation, Action, getModule } from 'vuex-module-decorators'
import axios from 'axios'
import { Token } from '@/models/Login/token';
import store from '@/store/index';
import { Utilisateur } from '@/models/Login/utilisateur';

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
  private SET_TOKEN(resp: Token): void {
    var dateExpire: string = (((resp.expires_in * 1000) + Date.now()).toString());
    localStorage.setItem("user-token", resp.value);
    localStorage.setItem("token-expire", dateExpire);
    this.token = resp.value;
    this.expire = dateExpire;
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
      if(userInfo.username == "Mars" && userInfo.password == "1234")
      {
        this.SET_TOKEN(new Token({value:"caca", expires_in: 9999999}));
        resolve();
      }else{
        this.LOGIN_FAIL();
        reject();
      }
      // axios.post<Token>(process.env.VUE_APP_ApiUrl + "/Authentication/Login", userInfo)
      //   .then((resp) => {
      //     this.SET_TOKEN(resp.data);
      //     resolve(resp);
      //   })
      //   .catch((err) => {
      //     this.LOGIN_FAIL();
      //     let errorMessage: string = "Impossible de se connecter au serveur d'authentification";
      //     if (err.response && err.response.status === 400) {
      //       errorMessage = err.response.data.Message;
      //     };
      //     reject(errorMessage);
      //   });
    });
  }

  @Action({rawError: true})
  public Register(userInfo: { username: string, password: string }): Promise<any> {
    return new Promise((resolve, reject) => {
      // axios.post<Token>(process.env.VUE_APP_ApiAuth + "/Authentication/Login", userInfo)
      //   .then((resp) => {
      //     this.SET_TOKEN(resp.data);
      //     resolve(resp);
      //   })
      //   .catch((err) => {
      //     this.LOGIN_FAIL();
      //     let errorMessage: string = "Impossible de se connecter au serveur d'authentification";
      //     if (err.response && err.response.status === 400) {
      //       errorMessage = err.response.data.Message;
      //     };
      //     reject(errorMessage);
      //   });
    });
  }

  @Action
  public Logout() {
    this.RESET_TOKEN();
  }
}

export const UserModule = getModule(User);