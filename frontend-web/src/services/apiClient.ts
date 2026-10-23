import axios,{
    type AxiosError,
    type InternalAxiosRequestConfig,
} from "axios";
import type { LoginResponse } from "../types/auth";
import { ROUTES } from "../routes/paths";
const apiClient = axios.create({
    baseURL:import.meta.env.VITE_API_BASE_URL,
    headers:{
        "Content-Type": "application/json"
    }
});

interface RetryRequestConfig extends InternalAxiosRequestConfig{
    _retry?: boolean;
}

// REQUEST INTERCEPTOR
apiClient.interceptors.request.use(
    (config) =>{
        const token = sessionStorage.getItem("accessToken");
        if (token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error)=>{
        return Promise.reject(error);
    }

)

// RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
    (response) => response,
    async(error:AxiosError) =>{
        const originalRequest = error.config as RetryRequestConfig | undefined;

        if (!originalRequest){
            return Promise.reject(error);
        }

        const isUnauthorized = error.response?.status === 401;
        const isAuthRequest = originalRequest.url === "/login" || originalRequest.url ==="/refresh" || originalRequest.url ==="/register";

        if (isUnauthorized&& !originalRequest._retry && !isAuthRequest){
            originalRequest._retry = true;

            const refreshToken = sessionStorage.getItem("refreshToken");

            if(!refreshToken){
                return Promise.reject(error);
            }

            try{
                const response = await axios.post<LoginResponse>(`${import.meta.env.VITE_API_BASE_URL}/refresh`, {refreshToken});

                sessionStorage.setItem("accessToken", response.data.token);
                sessionStorage.setItem("refreshToken",response.data.refreshToken);

                return apiClient(originalRequest)
            }catch( refreshError){
                sessionStorage.removeItem("accessToken");
                sessionStorage.removeItem("refreshToken");

                window.location.assign(ROUTES.login);
                
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    } 
);

export default apiClient;