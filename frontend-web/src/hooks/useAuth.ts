import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function useAuth(){
    const context = useContext(AuthContext);

    if (context === undefined){
        throw new Error("useAuth must be used within and AuthProvider");
    }
    return context; 
}