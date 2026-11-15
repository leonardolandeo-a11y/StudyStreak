export function readApiConfiguration(value: string | undefined, variable = 'VITE_API_BASE_URL', production = false) {
    const baseUrl = value?.trim().replace(/\/+$/, '');
    if (!baseUrl) {
        return { error: `${variable} is missing. Configure it in .env.local and restart the development server.` };
    }
    try {
        const url = new URL(baseUrl);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
            throw new Error('Invalid API URL');
        }
        if (production && url.protocol !== 'https:') return { error: `${variable} must use HTTPS in production.` };
        return { baseUrl };
    } catch {
        return { error: `${variable} must be an absolute HTTP(S) URL without credentials, query parameters or fragments.` };
    }
}

const configuration = readApiConfiguration(import.meta.env?.VITE_API_BASE_URL, 'VITE_API_BASE_URL', import.meta.env?.PROD === true);
export const apiBaseUrl = configuration.baseUrl;
export const apiConfigurationError = configuration.error;

export function requireApiBaseUrl(): string {
    if (!apiBaseUrl) throw new Error(apiConfigurationError);
    return apiBaseUrl;
}
