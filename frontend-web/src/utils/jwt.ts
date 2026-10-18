import type {
    AuthenticatedUser,
    JwtPayload
} from "../types/auth"

function decodeBase64Url(value :string):string{
    const normalized = value.replace(/-/g, "+").replace(/_/g,"/");

    const padding = "=".repeat((4-(normalized.length%4))%4);
    
    return atob(normalized+padding);
}
export function getUserFromToken(token:string):AuthenticatedUser|null{
    try{
        const parts = token.split(".");
        if(parts.length !== 3){
            return null;
        }
        const payloadJson = decodeBase64Url(parts[1]);

        const payload = JSON.parse(payloadJson) as JwtPayload;

        return {
            id: payload.userId,
            username:payload.sub,
            email:payload.email,
            role:payload.role,
        }
    }catch{
        return null;
    }
}