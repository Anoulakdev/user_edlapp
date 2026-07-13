/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

/* ================================
   Interfaces
================================ */

interface LoginResponse {
  data: {
    accessToken: string;
  };
}

/* ================================
   Token State (In-Memory)
================================ */

let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/* ================================
   Axios Instance
================================ */

export const externalApi: AxiosInstance = axios.create({
  baseURL: process.env.URL_API,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ================================
   Login Function
================================ */

async function login(): Promise<string> {
  const response: AxiosResponse<LoginResponse> = await axios.post(
    `${process.env.URL_API}/auth-svc/auth/login`,
    {
      username: process.env.USERNAME_API,
      password: process.env.PASSWORD_API,
    },
  );

  const token = response.data?.data?.accessToken;

  if (!token) {
    throw new Error('Cannot get token from login response');
  }

  accessToken = token;
  return token;
}

/* ================================
   Refresh Queue Helpers
================================ */

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

/* ================================
   Request Interceptor
================================ */

externalApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (!accessToken) {
      accessToken = await login();
    }

    config.headers.set('Authorization', `Bearer ${accessToken}`);
    return config;
  },
  (error) => Promise.reject(error),
);

/* ================================
   Response Interceptor
================================ */

externalApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // รอ token ใหม่
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.set('Authorization', `Bearer ${token}`);
            resolve(externalApi(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const newToken = await login();
        accessToken = newToken;

        onRefreshed(newToken);

        originalRequest.headers.set('Authorization', `Bearer ${newToken}`);

        return externalApi(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
