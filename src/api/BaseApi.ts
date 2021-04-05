import axios from 'axios';
import { UserModule } from '@/store/modules/user';

export default class BaseApi {
  static get axiosBase() {
    if (UserModule.isAuthenticate) {
      return axios.create({
        headers: { Authorization: `Bearer ${UserModule.token}` }
      });
    } else {
      return axios.create();
    }
  }

  static get CallToArmsApi() {
    //if (!this._lazyDocApi) {
    if (UserModule.isAuthenticate) {
      return axios.create({
        baseURL: process.env.VUE_APP_ApiCoreUrl,
        headers: { Authorization: `Bearer ${UserModule.token}` }
      });
    } else {
      return axios.create({
        baseURL: process.env.VUE_APP_ApiCoreUrl
      });
    }
  }
}
