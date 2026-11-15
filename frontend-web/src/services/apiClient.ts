import axios, {
    type AxiosError,
    type InternalAxiosRequestConfig,
} from "axios";
import type { LoginResponse } from "../types/auth";
import { getUserFromToken } from "../utils/jwt";
import { assertSessionRevision, getSessionRevision, storeRefreshedSession } from "./authSession";
import { apiBaseUrl } from "../config/api";
import { requireConfiguredApiBaseUrl } from "../config/apiRuntime";
import { ROUTES } from "../routes/paths";

const API_REQUEST_TIMEOUT_MS = 15000;

const apiClient = axios.create({
    baseURL: apiBaseUrl,
    timeout: API_REQUEST_TIMEOUT_MS,
});

interface RetryRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
    _sessionRevision?: number;
}

// Single-flight refresh: concurrent 401s must never consume the same one-time token.
let refreshTask: { revision: number; task: Promise<LoginResponse> } | null = null;

apiClient.interceptors.request.use((config: RetryRequestConfig) => {
    config.baseURL = requireConfiguredApiBaseUrl();
    const revision = config._sessionRevision ?? getSessionRevision();
    assertSessionRevision(revision);
    config._sessionRevision = revision;
    const token = sessionStorage.getItem("accessToken");
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
    return config;
}, error => { throw error; }, { synchronous: true });

apiClient.interceptors.response.use(
    (response) => {
        assertSessionRevision((response.config as RetryRequestConfig)._sessionRevision!);
        return response;
    },
    async (error: AxiosError) => {
        const original = error.config as RetryRequestConfig | undefined;
        if (original?._sessionRevision !== undefined) assertSessionRevision(original._sessionRevision);
        if (!original || error.response?.status !== 401 || original._retry ||
            /^\/(login|refresh|register|logout)(\?|$)/.test(original.url ?? "")) {
            return Promise.reject(error);
        }
        const revision = original._sessionRevision!;
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
            if (!refreshTask || refreshTask.revision !== revision) {
                const task = axios.post<LoginResponse>(
                    `${requireConfiguredApiBaseUrl()}/refresh`, { refreshToken },
                    { timeout: API_REQUEST_TIMEOUT_MS },
                ).then((response) => {
                    if (sessionStorage.getItem("refreshToken") !== refreshToken) {
                        throw new Error("Authentication session changed during refresh");
                    }
                    if (!getUserFromToken(response.data.token)) {
                        throw new Error("Invalid access token returned by refresh.");
                    }
                    storeRefreshedSession(response.data, revision);
                    return response.data;
                }).finally(() => { if (refreshTask?.task === task) refreshTask = null; });
                refreshTask = { revision, task };
            }
            await refreshTask.task;
            assertSessionRevision(revision);
            return apiClient(original);
        } catch (refreshError) {
            assertSessionRevision(revision);
            if (axios.isAxiosError(refreshError) && [400, 401, 403].includes(refreshError.response?.status ?? 0) &&
                sessionStorage.getItem("refreshToken") === refreshToken) {
                sessionStorage.removeItem("accessToken");
                sessionStorage.removeItem("refreshToken");
                window.location.assign(ROUTES.login);
            }
            return Promise.reject(refreshError);
        }
    },
);

export default apiClient;
