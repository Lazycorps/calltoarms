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
import { Game } from '@/models/Game/game';
import { Friend } from '@/models/Friend/friend';
import { GamesLibraryApi } from '@/api/GamesLibraryApi';
import { NotificationApi } from '@/api/NotificationApi';

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
  private SET_UTILISATEUR(user: Utilisateur): void {
    this.utilisateur = user;
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

  @Mutation
  private ADD_GAME_LIBRARY(game: Game){
    this.utilisateur.games.push(game);
  }

  @Mutation
  private ADD_FRIEND(friend: Friend){
    this.utilisateur.friends.push(friend);
  }

  @Mutation
  private RESET_USER(){
    this.utilisateur = new Utilisateur();
  }

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

  @Action({rawError: true})
  public async LoadUtilisateur(): Promise<any> {
    try{
     let user = await UserApi.getConnected();
     this.SET_UTILISATEUR(user);
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
    this.RESET_USER();
    this.SET_IS_ADMIN(false);
    this.SET_USERNAME("");
    resetRouter();
  }

  @Action
  public async AddGameLibrary(game: Game): Promise<void> {
    await GamesLibraryApi.addGame(game.id, this.utilisateur.username);
    this.ADD_GAME_LIBRARY(game);
  }

  @Action({rawError: true})
  public async AddFriend(friend: string): Promise<Friend> {
    return new Promise<Friend>((resolve, reject) => {
      UserApi.addFriend(friend.trim()).then((user) => {
        const friends = user.friends;
        const friendAdd = friends.find(f => f.username == friend || f.email == friend);
        if(friendAdd){
          this.ADD_FRIEND(friendAdd);
          resolve(friendAdd);
        }else throw "User not found";
      }).catch((error) => {
        reject(error.response.data);
      });
    });
  }

  @Action({rawError : true})
  public async RemoveNotification(id: number){
    NotificationApi.deleteNotification(id).then(()=> {
      const notifToRemove = this.utilisateur.notifications_received.find(i => i.id == id);
      if(notifToRemove){
        const index = this.utilisateur.notifications_received.indexOf(notifToRemove);
        if (index > -1) this.utilisateur.notifications_received.splice(index, 1);
      }
    });
  }
}
 
export const UserModule = getModule(User);