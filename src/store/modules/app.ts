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

  @Action
  public ToggleDevice(device: DeviceType) {
    this.TOGGLE_DEVICE(device)
  }

  @Action
  public NewNotificationReceived(value: boolean) {
    this.SET_NEW_NOTIFICATION(value)
  }

  @Action
  public async InitPushNotification(value: boolean) {
    this.SET_NOTIFICATION_STATUS(value);
    // try {
    //   if(UserModule.token){
    //     var config = {
    //       apiKey: "AIzaSyB2_byyXGkLlP7Icn2ckInxHm62IEHeZ9E",
    //       authDomain: "iplaybitch.firebaseapp.com",
    //       databaseURL: "https://iplaybitch.firebaseio.com/",
    //       projectId: "iplaybitch",
    //       storageBucket: "iplaybitch.appspot.com",
    //       messagingSenderId: "1031582684001",
    //       appId: "1:1031582684001:web:94d0df1ade779e85dd2b20",
    //       measurementId: "G-BVYJKFCT1R"
    //     }; // 4. Get Firebase Configuration
    //     firebase.initializeApp(config);
    
    //     const messaging = firebase.messaging();
    
    //     messaging.usePublicVapidKey("BHz_yN7iQlV2j4oDBV6c432Eqw6wmQmj_YKR0xzRWlpK_RawaJ4MJzh_9IeqDjnAyCQT4OyUBMWev89uQ6gSvbQ"); // 1. Generate a new key pair
    
    //     // Request Permission of Notifications
    //     await messaging.requestPermission();
    //     console.log('Notification permission granted.');
    //     let token = await messaging.getToken();
    //     console.log("token");
    //     await UserApi.updateFirebaseToken(token);
    //     this.SET_NOTIFICATION_STATUS(true);
    //     console.log("token updated");

    //     messaging.onMessage(payload => {
    //       console.log("Message received. ", payload);
    //       const { title, ...options } = payload.notification;
    //     });
        
    //   }
    // } catch (error) {
    //   this.SET_NOTIFICATION_STATUS(false);
    //   console.log('Unable to get permission to notify.', error);
    // }
  }
}

export const AppModule = getModule(App)
