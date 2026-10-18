import apiClient from "./apiClient";
import type {
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RegisterRequest,
    RegisterResponse
} from "../types/auth";


export async function login(credentials : LoginRequest) : Promise<LoginResponse>{
    const response = await apiClient.post<LoginResponse>("/login", credentials);
    return response.data;
}

export async function refreshToken(request:RefreshTokenRequest) : Promise<LoginResponse>{
    const response = await apiClient.post<LoginResponse>("/refresh", request);
    return response.data;
}
export async function register(user :RegisterRequest): Promise<RegisterResponse>{
    const response = await apiClient.post<RegisterResponse>("/register", user);
    return response.data;

}