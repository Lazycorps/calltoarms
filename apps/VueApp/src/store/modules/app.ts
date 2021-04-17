import { VuexModule, Module, Mutation, Action, getModule } from 'vuex-module-decorators';
import store from '@/store';
import firebase from 'firebase';
import { UserModule } from './user';
import { UserApi } from '@/api/UserApi';

export enum DeviceType {
  Mobile,
  Desktop
}

export interface IAppState {
  device: DeviceType;
}

@Module({ dynamic: true, store, name: 'app' })
class App extends VuexModule implements IAppState {
  public device = DeviceType.Desktop;
  public pushNotificationEnabled = true;
  public newNotification = false;
  public notificationSound: string = localStorage.getItem('notification-sound') || '';

  @Mutation
  private TOGGLE_DEVICE(device: DeviceType) {
    this.device = device;
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
    localStorage.setItem('notification-sound', path);
  }

  @Action
  public ToggleDevice(device: DeviceType) {
    this.TOGGLE_DEVICE(device);
  }

  @Action
  public NewNotificationReceived(value: boolean) {
    this.SET_NEW_NOTIFICATION(value);
    UserModule.LoadUtilisateur();
    if (value && this.notificationSound) {
      const audio = new Audio(`${process.env.BASE_URL}/audio/notifications/${this.notificationSound}`);
      audio.play();
    }
  }

  @Action
  public ChangeNotificationSound(path: string) {
    this.SET_NOTIFICATION_SOUND(path);
  }

  @Action({ rawError: true })
  public async InitPushNotification() {
    if (UserModule.token) {
      const config = {
        apiKey: 'AIzaSyB2_byyXGkLlP7Icn2ckInxHm62IEHeZ9E',
        authDomain: 'iplaybitch.firebaseapp.com',
        databaseURL: 'https://iplaybitch.firebaseio.com/',
        projectId: 'iplaybitch',
        storageBucket: 'iplaybitch.appspot.com',
        messagingSenderId: '1031582684001',
        appId: '1:1031582684001:web:94d0df1ade779e85dd2b20',
        measurementId: 'G-BVYJKFCT1R'
      }; // 4. Get Firebase Configuration
      firebase.initializeApp(config);

      const messaging = firebase.messaging();

      messaging.usePublicVapidKey(
        'BHz_yN7iQlV2j4oDBV6c432Eqw6wmQmj_YKR0xzRWlpK_RawaJ4MJzh_9IeqDjnAyCQT4OyUBMWev89uQ6gSvbQ'
      ); // 1. Generate a new key pair

      // Request Permission of Notifications
      messaging
        .requestPermission()
        .then(() => {
          console.log('Notification permission granted.');
          messaging
            .getToken()
            .then((token) => {
              UserApi.updateFirebaseToken(token);
              this.SET_NOTIFICATION_STATUS(true);
              messaging.onMessage((payload) => {
                console.log('Message received. ', payload);
                this.SET_NEW_NOTIFICATION(true);
                //const { title, ...options } = payload.notification;
              });
            })
            .catch((error) => {
              this.SET_NOTIFICATION_STATUS(false);
              console.log('1 - Unable to get permission to notify.', error);
            });
        })
        .catch((error) => {
          this.SET_NOTIFICATION_STATUS(false);
          console.log('2 - Unable to get permission to notify.', error);
        });
    }
  }
}
//const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
export const AppModule = getModule(App);
