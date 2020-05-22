import { VuexModule, Module, Mutation, Action, getModule } from 'vuex-module-decorators'
import store from '@/store'
import firebase from 'firebase';
import { UserModule } from './user';
import { UserApi } from '@/api/UserApi';

export enum DeviceType {
  Mobile,
  Desktop,
}

export interface IAppState {
  device: DeviceType
}

@Module({ dynamic: true, store, name: 'app' })
class App extends VuexModule implements IAppState {
  public device = DeviceType.Desktop
  public pushNotificationEnabled: boolean = true;
  public newNotification: boolean = false;
  public notificationSound: string = localStorage.getItem("notification-sound") || "";;

  @Mutation
  private TOGGLE_DEVICE(device: DeviceType) {
    this.device = device
  }

  @Mutation
  private SET_NOTIFICATION_STATUS(enabled: boolean) {
    this.pushNotificationEnabled = enabled;
  }

  @Mutation
  private SET_NEW_NOTIFICATION(value: boolean) {
    this.newNotification = value;
  }

  @Mutation
  private SET_NOTIFICATION_SOUND(path: string) {
    this.notificationSound = path;
    localStorage.setItem("notification-sound", path);
  }

  @Action
  public ToggleDevice(device: DeviceType) {
    this.TOGGLE_DEVICE(device)
  }

  @Action
  public NewNotificationReceived(value: boolean) {
    this.SET_NEW_NOTIFICATION(value)
    UserModule.LoadUtilisateur();
    if(value && this.notificationSound){
      var audio = new Audio(`${process.env.VUE_APP_BaseUrl}/audio/notifications/${this.notificationSound}`);
      audio.play();
    }
  }

  @Action
  public ChangeNotificationSound(path: string) {
    this.SET_NOTIFICATION_SOUND(path);
  }

  @Action
  public async InitPushNotification(value: boolean) {
    this.SET_NOTIFICATION_STATUS(value);
  }
}

export const AppModule = getModule(App)
