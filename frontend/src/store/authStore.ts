import { create } from "zustand";

interface User {
    id: string;
    tenDangNhap: string;
    hoVaTen: string;
    vaiTro: string;
    sdt?: string;
    cccd?: string;
    phongHienTai?: {
        _id: string;
        tenPhong: string;
        dienTich: number;
        loaiPhong: string;
    };
}


interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    setAuth: (user: User, accessToken: string, refreshToken: string) => void;
    updateUser: (user: User) => void;
    setAccessToken: (accessToken: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
    // Safely parse user to avoid string "null" issues
    let initialUser = null;
    try {
        const userStr = sessionStorage.getItem("user");
        initialUser = userStr && userStr !== "undefined" && userStr !== "null" ? JSON.parse(userStr) : null;
    } catch (e) {
        initialUser = null;
    }

    const getSafeToken = (key: string) => {
        const token = sessionStorage.getItem(key);
        return token && token !== "undefined" && token !== "null" ? token : null;
    };

    return {
        user: initialUser,
        accessToken: getSafeToken("accessToken"),
        refreshToken: getSafeToken("refreshToken"),
        setAuth: (user, accessToken, refreshToken) => {
            sessionStorage.setItem("user", JSON.stringify(user));
            sessionStorage.setItem("accessToken", accessToken);
            sessionStorage.setItem("refreshToken", refreshToken);
            set({ user, accessToken, refreshToken });
        },
        updateUser: (user) => {
            sessionStorage.setItem("user", JSON.stringify(user));
            set({ user });
        },
        setAccessToken: (accessToken) => {
            sessionStorage.setItem("accessToken", accessToken);
            set({ accessToken });
        },
        logout: () => {
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("accessToken");
            sessionStorage.removeItem("refreshToken");
            set({ user: null, accessToken: null, refreshToken: null });
        },
    };
});
