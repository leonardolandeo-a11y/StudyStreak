import axios, {
    type AxiosError,
    type InternalAxiosRequestConfig,
} from "axios";
import type { LoginResponse } from "../types/auth";
import { ROUTES } from "../routes/paths";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

interface RetryRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

// Single-flight refresh: concurrent 401s must never consume the same one-time token.
let refreshTask: Promise<LoginResponse> | null = null;

apiClient.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("accessToken");
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const original = error.config as RetryRequestConfig | undefined;
        if (!original || error.response?.status !== 401 || original._retry ||
            /^\/(login|refresh|register|logout)(\?|$)/.test(original.url ?? "")) {
            return Promise.reject(error);
        }
        original._retry = true;
        const refreshToken = sessionStorage.getItem("refreshToken");
        if (!refreshToken) return Promise.reject(error);

        try {
            const latestAccess = sessionStorage.getItem("accessToken");
            const requestAccess = original.headers.get("Authorization");
            // A separate request may have refreshed the token after this request was sent.
            if (latestAccess && requestAccess !== `Bearer ${latestAccess}`) {
                return apiClient(original);
            }
            if (!refreshTask) {
                refreshTask = axios.post<LoginResponse>(
                    `${import.meta.env.VITE_API_BASE_URL}/refresh`, { refreshToken },
                ).then((response) => {
                    if (sessionStorage.getItem("refreshToken") !== refreshToken) {
                        throw new Error("Authentication session changed during refresh");
                    }
                    sessionStorage.setItem("accessToken", response.data.token);
                    sessionStorage.setItem("refreshToken", response.data.refreshToken);
                    return response.data;
                }).finally(() => { refreshTask = null; });
            }
            await refreshTask;
            return apiClient(original);
        } catch (refreshError) {
            if (sessionStorage.getItem("refreshToken") === refreshToken) {
                sessionStorage.removeItem("accessToken");
                sessionStorage.removeItem("refreshToken");
                window.location.assign(ROUTES.login);
            }
            return Promise.reject(refreshError);
        }
    },
);

export default apiClient;
