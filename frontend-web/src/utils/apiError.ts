import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (!axios.isAxiosError(error)) return fallback;
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") return "The request timed out. Please try again.";
    if (!error.response) return "Could not connect to StudyStreak. Check your internet connection and try again.";

    switch (error.response.status) {
        case 400: return "Please check the information and try again.";
        case 401: return "Your session has expired. Please sign in again.";
        case 403: return "You do not have permission to perform this action.";
        case 404: return "The requested resource was not found.";
        case 409: return "This action conflicts with existing data. Please review and try again.";
        case 429: return "Too many requests. Please wait and try again.";
        default: return error.response.status >= 500 ? "StudyStreak is temporarily unavailable. Please try again later." : fallback;
    }
}
