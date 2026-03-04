import api from "./api";

export interface Contract {
    _id: string;
    idPhong: string | any;
    idKhach: string | any;
    ngayBatDau: string;
    ngayKetThuc?: string;
    giaThue: number;
    tienCoc: number;
    giaDien?: number;
    giaNuoc?: number;
    trangThai: "Con_Hieu_Luc" | "Ket_Thuc";
    ghiChu?: string;
    createdAt: string;
}


export const contractService = {
    getAllHopDongs: async () => {
        const response = await api.get<Contract[]>("/hopdong");
        return response.data;
    },
    createHopDong: async (data: Partial<Contract>) => {
        const response = await api.post<Contract>("/hopdong", data);
        return response.data;
    },
    updateHopDong: async (id: string, data: Partial<Contract>) => {
        const response = await api.put<Contract>(`/hopdong/${id}`, data);
        return response.data;
    },
    deleteHopDong: async (id: string) => {
        const response = await api.delete(`/hopdong/${id}`);
        return response.data;
    },
    extendHopDong: async (id: string, ngayKetThucMoi: string) => {
        const response = await api.put(`/hopdong/${id}/extend`, { ngayKetThucMoi });
        return response.data;
    },
};
