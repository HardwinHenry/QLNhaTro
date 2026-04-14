import api from "./api";

export interface YeuCauBaoTri {
    _id: string;
    idPhong: {
        _id: string;
        tenPhong: string;
    };
    idKhach: {
        _id: string;
        tenDangNhap: string;
        hoTen?: string;
        soDienThoai?: string;
    };
    idVatTu?: {
        _id: string;
        tenVatTu: string;
    };
    moTa: string;
    hinhAnh?: string;
    trangThai: "Dang_Cho" | "Dang_Xu_Ly" | "Da_Hoan_Thanh";
    ngayYeuCau: string;
    createdAt: string;
}

export const maintenanceService = {
    getAll: async () => {
        const response = await api.get<YeuCauBaoTri[]>("/baotri");
        return response.data;
    },
    getMine: async () => {
        const response = await api.get<YeuCauBaoTri[]>("/baotri/me");
        return response.data;
    },
    create: async (formData: FormData) => {
        const response = await api.post<YeuCauBaoTri>("/baotri", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },
    updateStatus: async (id: string, trangThai: string) => {
        const response = await api.put<YeuCauBaoTri>(`/baotri/${id}`, { trangThai });
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/baotri/${id}`);
        return response.data;
    },
};
