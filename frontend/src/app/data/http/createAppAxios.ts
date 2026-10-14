import axios, { type AxiosInstance } from "axios";

import type { AppConfig } from "@/app/bootstrap/config/appConfig";

/** Creates the one application-owned Axios instance from validated config. */
export function createAppAxios(config: AppConfig): AxiosInstance {
  return axios.create({
    baseURL: config.VITE_API_BASE_URL,
    headers: {
      Accept: "application/json",
    },
    timeout: config.VITE_REQUEST_TIMEOUT_MS,
    withCredentials: config.VITE_API_WITH_CREDENTIALS,
  });
}
