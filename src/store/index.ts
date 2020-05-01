import Vue from "vue";
import Vuex from "vuex";
import { IUserState } from "./modules/user"
import { IPermissionState } from "./modules/permissions"
Vue.use(Vuex);

export interface IRootState {
  login: IUserState,
  permission: IPermissionState,
}

export default new Vuex.Store<IRootState>({})
