import axios, { AxiosError } from 'axios';
import { GetServerSidePropsContext } from 'next';
import { parseCookies, setCookie } from 'nookies';
import { signOut } from '../context/AuthContext';
import { AuthTokenError } from './errors/AuthTokenError';

type FailedRequest = {
  onSuccess(token: string): void;
  onFailure(err: AxiosError): void;
}

let isRefreshing = false
let failedRequestQueue: FailedRequest[] = []

export function setupAPIClient(ctx?: GetServerSidePropsContext) {
  let cookies = parseCookies(ctx)

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`,
    }
  })
  
  api.interceptors.response.use(response => {
    return response;
  }, (error: AxiosError) => {
    if (error.response?.status === 401) {
      // @ts-ignore
      if (error.response.data?.code === 'token.expired') {
        cookies = parseCookies(ctx)
  
        const { 'nextauth.refreshToken': refreshToken} = cookies
        const originalConfig = error.config
  
        if (!isRefreshing) {
          isRefreshing = true
  
          api.post('/refresh', {
            refreshToken,
          }).then(response => {
            const { data } = response
    
            setCookie(ctx, "nextauth.token", data.token, {
              maxAge: 60 * 60 * 24 * 30, //30 days,
              path: "/",
            });
      
            setCookie(ctx, "nextauth.refreshToken", data.refreshToken, {
              maxAge: 60 * 60 * 24 * 30, //30 days,
              path: "/",
            });
    
            // @ts-ignore
            api.defaults.headers["Authorization"] = `Bearer ${data.token}`;
  
            failedRequestQueue.forEach(resquest => resquest.onSuccess(data.token))
            failedRequestQueue = []
          }).catch(err => {
            failedRequestQueue.forEach(resquest => resquest.onFailure(err))
            failedRequestQueue = []
  
            if (process.browser) {
              signOut()
            }
          }).finally(() => {
            isRefreshing = false;
          })
        }
  
        return new Promise((resolve, reject) => {
          failedRequestQueue.push({
            onSuccess: (token: string) => {
              // @ts-ignore
              originalConfig.headers['Authorization'] = `Bearer ${token}`
  
              resolve(api(originalConfig))
            },
            onFailure: (err: AxiosError) => {
              reject(err)
            }
          })
        })
      } else {
        if (process.browser) {
          signOut()
        } else {
          return Promise.reject(new AuthTokenError())
        }
      }
    }
  
    return Promise.reject(error)
  });

  return api;
}