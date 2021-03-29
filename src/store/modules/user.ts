import { Module, VuexModule, Mutation, Action, getModule } from 'vuex-module-decorators';
import { TokenDTO } from '@/models/Login/token';
import store from '@/store/index';
import { Utilisateur } from '@/models/Login/utilisateur';
import { UserRegister } from '@/models/User/UserRegister';
import { UserApi } from '@/api/UserApi';
import { JsonConvert } from 'json2typescript';
import jwtDecode from 'jwt-decode';
import { resetRouter, initDynamicRoutes } from '@/router/index';
import { AppModule } from './app';
import { Game } from '@/models/Game/game';
import { GamesLibraryApi } from '@/api/GamesLibraryApi';
import { NotificationApi } from '@/api/NotificationApi';

export interface IUserState {
  token: string;
  username: string;
  status: string;
  utilisateur: Utilisateur;
}

@Module({ dynamic: true, store, name: 'user' })
class User extends VuexModule implements IUserState {
  public token: string = localStorage.getItem('user-token') || '';
  public status = '';
  public utilisateur: Utilisateur = new Utilisateur();
  public username: string = localStorage.getItem('username') || '';
  public isAdmin = false;

  get isAuthenticate(): boolean {
    return !!this.token;
  }

  @Mutation
  private SET_TOKEN(token: string): void {
    localStorage.setItem('user-token', token);
    this.token = token;
    this.status = 'success';

    const tokenDecode = jwtDecode(this.token);
    const jsonConvert: JsonConvert = new JsonConvert();
    const tokenValue = jsonConvert.deserializeObject(tokenDecode, TokenDTO);
    localStorage.setItem('username', tokenValue.username);
    this.username = tokenValue.username;
  }

  @Mutation
  private LOGIN_FAIL(): void {
    this.status = 'error';
  }

  @Mutation
  private SET_UTILISATEUR(user: Utilisateur): void {
    this.utilisateur = user;
  }

  @Mutation
  private SET_USERNAME(username: string): void {
    this.status = username;
  }

  @Mutation
  private SET_IS_ADMIN(isAdmin: boolean): void {
    this.isAdmin = isAdmin;
  }

  @Mutation
  private RESET_TOKEN(): void {
    localStorage.removeItem('user-token');
    localStorage.removeItem('username');
    this.token = '';
    this.username = '';
  }

  @Mutation
  private ADD_GAME_LIBRARY(game: Game) {
    this.utilisateur.games.push(game);
  }

  @Mutation
  private RESET_USER() {
    this.utilisateur = new Utilisateur();
  }

  @Action({ rawError: true })
  public async Login(userInfo: { login: string; password: string }): Promise<any> {
    try {
      const token = await UserApi.login(userInfo);
      this.SET_TOKEN(token);
      initDynamicRoutes();
      AppModule.InitPushNotification();
    } catch (err) {
      this.LOGIN_FAIL();
      let errorMessage = err;
      if (err.response) {
        errorMessage = `${err.response.data.status} : ${err.response.data.error}`;
      }
      throw errorMessage;
    }
  }

  @Action({ rawError: true })
  public async LoadUtilisateur(): Promise<any> {
    try {
      const user = await UserApi.getConnected();
      this.SET_UTILISATEUR(user);
      initDynamicRoutes();
    } catch (err) {
      this.LOGIN_FAIL();
      let errorMessage = err;
      if (err.response) {
        errorMessage = `${err.response.data.status} : ${err.response.data.error}`;
      }
      throw errorMessage;
    }
  }

  @Action
  public ReadToken(): void {
    try {
      if (this.token) {
        const tokenDecode = jwtDecode(this.token);
        const jsonConvert: JsonConvert = new JsonConvert();
        const tokenValue = jsonConvert.deserializeObject(tokenDecode, TokenDTO);
        this.SET_USERNAME(tokenValue?.username);
        this.SET_IS_ADMIN(tokenValue?.is_admin);
        initDynamicRoutes();
      }
    } catch (err) {
      let errorMessage = err;
      if (err.response) {
        errorMessage = `${err.response.data.status} : ${err.response.data.error}`;
      }
      throw errorMessage;
    }
  }

  @Action({ rawError: true })
  public async Register(userInfo: UserRegister): Promise<any> {
    try {
      await UserApi.register(userInfo);
    } catch (err) {
      let errorMessage = err;
      if (err.response) {
        errorMessage = `${err.response.data.status} : ${err.response.data.error}`;
      }
      throw errorMessage;
    }
  }

  @Action
  public Logout() {
    this.RESET_TOKEN();
    this.RESET_USER();
    this.SET_IS_ADMIN(false);
    this.SET_USERNAME('');
    resetRouter();
  }

  @Action
  public async AddGameLibrary(game: Game): Promise<void> {
    await GamesLibraryApi.addGame(game.id, this.utilisateur.username);
    this.ADD_GAME_LIBRARY(game);
  }

  @Action({ rawError: true })
  public async AddFriend(friend: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      UserApi.addFriend(friend.trim())
        .then((user) => {
          this.SET_UTILISATEUR(user);
          resolve();
        })
        .catch((error) => {
          reject(error.response.data);
        });
    });
  }

  @Action({ rawError: true })
  public async RemoveNotification(id: number) {
    NotificationApi.deleteNotification(id).then(() => {
      const notifToRemove = this.utilisateur.notifications_received.find((i) => i.id == id);
      if (notifToRemove) {
        const index = this.utilisateur.notifications_received.indexOf(notifToRemove);
        if (index > -1) this.utilisateur.notifications_received.splice(index, 1);
      }
    });
  }

  @Action({ rawError: true })
  public async UpdateFriendship(firenship: { id: number; status: string; subscribed: boolean }) {
    UserApi.updateFriendship(firenship.id, firenship.status, firenship.subscribed);
  }
}

export const UserModule = getModule(User);
