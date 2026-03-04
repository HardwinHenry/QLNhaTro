const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const API_BASE_URL = trimTrailingSlash(rawApiUrl || "/api");

export const BACKEND_BASE_URL = API_BASE_URL.endsWith("/api")
    ? API_BASE_URL.slice(0, -4)
    : API_BASE_URL;

export const resolveBackendAssetUrl = (assetPath?: string | null) => {
    if (!assetPath) return "";
    if (/^https?:\/\//i.test(assetPath)) return assetPath;
    if (!assetPath.startsWith("/")) return assetPath;
    return `${BACKEND_BASE_URL}${assetPath}`;
};
