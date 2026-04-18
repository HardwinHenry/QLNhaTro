const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const API_BASE_URL = trimTrailingSlash(rawApiUrl || "/api");

export const BACKEND_BASE_URL = API_BASE_URL.endsWith("/api")
    ? API_BASE_URL.slice(0, -4)
    : API_BASE_URL;

export const loaiPhongLabels: Record<string, string> = {
    Co_Gac: "Có gác",
    Khong_Gac: "Không gác",
    Phong_Thương: "Phòng thường",
    PHONG_THUONG: "Phòng thường",
};

export const resolveBackendAssetUrl = (assetPath?: string | null) => {
    if (!assetPath) return "";
    if (/^https?:\/\//i.test(assetPath)) return assetPath;
    
    // Ensure leading slash
    const path = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
    return `${BACKEND_BASE_URL}${path}`;
};

export const resolveRoomImageUrl = (imagePath?: string | null) => {
    if (!imagePath || typeof imagePath !== 'string') return "/RoomPlaceholder.jpg";
    
    // If it's already a full URL, return it
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    
    // Handle path cleaning (remove potential double slashes at start)
    const cleanPath = imagePath.replace(/\/+/, "/");
    
    // If it starts with /uploads, it's a backend asset
    if (cleanPath.startsWith("/uploads") || cleanPath.includes("uploads/")) {
        // Find where uploads starts
        const uploadsIndex = cleanPath.indexOf("uploads/");
        const path = `/${cleanPath.substring(uploadsIndex)}`;
        return resolveBackendAssetUrl(path);
    }
    
    // If it starts with /Phong, it's a local static asset
    if (cleanPath.startsWith("/Phong") || cleanPath.includes("Phong")) {
        const phongIndex = cleanPath.indexOf("Phong");
        const path = `/${cleanPath.substring(phongIndex)}`;
        return path;
    }
    
    // Ensure leading slash for any other local path
    return cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
};
