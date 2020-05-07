import { Module, VuexModule, Mutation, Action, getModule } from 'vuex-module-decorators'
import axios from 'axios'
import { TokenDTO } from '@/models/Login/token';
import store from '@/store/index';
import { Utilisateur } from '@/models/Login/utilisateur';
import { UserRegister } from '@/models/User/UserRegister';
import { UserApi } from '@/api/UserApi';
import { JsonObject, JsonProperty, JsonConvert } from "json2typescript";
import jwtDecode from "jwt-decode";
import router, { resetRouter, initDynamicRoutes } from '@/router/index'
import { AppModule } from './app';

export interface IUserState {
  token: string,
  username: string,
  status: string,
  utilisateur: Utilisateur
}

@Module({ dynamic: true, store, name: 'user' })
class User extends VuexModule implements IUserState {
  public token: string = localStorage.getItem("user-token") || "";
  public status: string = '';
  public utilisateur: Utilisateur = new Utilisateur();
  public username: string = localStorage.getItem("username") || "";
  public isAdmin: boolean = false;

  @Mutation
  private SET_TOKEN(token: string): void {
    localStorage.setItem("user-token", token);
    this.token = token;
    this.status = "success";

    let tokenDecode = jwtDecode(this.token);
    let jsonConvert: JsonConvert = new JsonConvert();
    let tokenValue = jsonConvert.deserializeObject(tokenDecode, TokenDTO);
    localStorage.setItem("username", tokenValue.username);
    this.username = tokenValue.username;
  };

  @Mutation
  private LOGIN_FAIL(): void {
    this.status = "error";
  };

  @Mutation
  private SET_USERNAME(username: string): void {
    this.status = username;
  };

  @Mutation
  private SET_IS_ADMIN(isAdmin: boolean): void {
    this.isAdmin = isAdmin;
  };

  @Mutation
  private RESET_TOKEN(): void {
    localStorage.removeItem("user-token");
    localStorage.removeItem("username");
    this.token = "";
    this.username = "";
  };

  @Action({rawError: true})
  public async Login(userInfo: { login: string, password: string }): Promise<any> {
    try{
      let token = await UserApi.login(userInfo);
      this.SET_TOKEN(token);
      window.location.reload(true);
      //this.ReadToken();
      //AppModule.InitPushNotification();
    }catch(err){
      this.LOGIN_FAIL();
      let errorMessage = err;
      if (err.response) {
        errorMessage = `${err.response.data.status} : ${err.response.data.error}`;
      }
      throw(errorMessage);
    }
  }

  @Action
  public ReadToken(): void {
    try{
      if(this.token){
        let tokenDecode = jwtDecode(this.token);
        let jsonConvert: JsonConvert = new JsonConvert();
        let tokenValue = jsonConvert.deserializeObject(tokenDecode, TokenDTO);
        this.SET_USERNAME(tokenValue?.username);
        this.SET_IS_ADMIN(tokenValue?.is_admin);
        initDynamicRoutes();
      }
    }catch(err){
      let errorMessage = err;
      if (err.response) {
        errorMessage = `${err.response.data.status} : ${err.response.data.error}`;
      }
      throw(errorMessage);
    }
  }

  @Action({rawError: true})
  public async Register(userInfo: UserRegister): Promise<any> {
    try{
      await UserApi.register(userInfo);
    } catch(err) {
      let errorMessage = err;
      if (err.response) {
        errorMessage = `${err.response.data.status} : ${err.response.data.error}`;
      }
      throw(errorMessage);
    }
  }

  @Action
  public Logout() {
    this.RESET_TOKEN();
    this.SET_IS_ADMIN(false);
    this.SET_USERNAME("");
    resetRouter();
  }
}
 
export const UserModule = getModule(User);