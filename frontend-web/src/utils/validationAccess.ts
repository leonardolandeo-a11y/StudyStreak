export type ValidationLookupState = "create" | "blocked" | "retry";

export function validationLookupState(status?: number): ValidationLookupState {
    if (status === 404) return "create";
    if (status === 403) return "blocked";
    return "retry";
}
