export interface LoginRequest{
    username: string;
    password: string;
}

export interface LoginResponse{
    token: string;
    refreshToken: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RegisterRequest{
    username : string;
    email:string;
    password: string;
    timeZone:string;
}
export interface RegisterResponse{
    id :number;
    username:string;
    email:string;
    active :boolean;
    registrationDate:string;
    timeZone:string;
}

export interface JwtPayload{
    sub :string;
    userId : number;
    email : string;
    role : "USER"|"ADMIN";
    type : "access" | "refresh";
    iat : number;
    exp: number;
}
export interface AuthenticatedUser{
    id:number;
    username:string;
    email:string;
    role:"USER"|"ADMIN";
}