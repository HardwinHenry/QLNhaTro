import api from "./api";

export interface CauHinh {
    _id: string;
    nganHang: string;
    soTaiKhoan: string;
    chuTaiKhoan: string;
    createdAt: string;
    updatedAt: string;
}

export const cauHinhService = {
    getLatestCauHinh: async () => {
        const response = await api.get<CauHinh>("/cauhinh/latest");
        return response.data;
    },

    updateCauHinh: async (data: { nganHang: string; soTaiKhoan: string; chuTaiKhoan: string }) => {
        const response = await api.put<CauHinh>("/cauhinh", data);
        return response.data;
    }
};
