import axios from "axios";
import { useCurrentUser } from "vuefire";

export function useApi() {
  const currentUser = useCurrentUser();

  const api = axios.create({
    baseURL: import.meta.env.VITE_CallToArmsApi,
  });

  api.interceptors.request.use(
    async (config) => {
      const idToken = await currentUser.value?.getIdToken();
      config.headers.Authorization = `Bearer ${idToken}`;
      return config;
    },
    function (error) {
      // Do something with request error
      return Promise.reject(error);
    }
  );

  return { api };
}
