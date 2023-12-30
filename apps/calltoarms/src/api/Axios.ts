import axios from "axios";
import { getAuth } from "firebase/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_CallToArmsApi,
});

api.interceptors.request.use(
  async (config) => {
    const auth = getAuth();
    const idToken = await auth.currentUser?.getIdToken();
    config.headers.Authorization = `Bearer ${idToken}`;
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);
