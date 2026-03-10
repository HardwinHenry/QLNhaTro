import api from "./api";

export const login = async (tenDangNhap: string, matKhau: string) => {
    const response = await api.post("/auth/login", { tenDangNhap, matKhau });
    return response.data;
};

export const register = async (userData: {
    hoVaTen: string;
    tenDangNhap: string;
    matKhau: string;
    sdt: string;
    cccd: string;
    vaiTro?: string;
}) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
};

export const getAllUsers = async () => {
    const response = await api.get("/auth/users");
    return response.data;
};
export const updateMe = async (userData: any) => {
    const response = await api.put("/auth/me", userData);
    return response.data;
};

export const getMe = async () => {
    const response = await api.get("/auth/me");
    return response.data;
};
