import api from "./api";

export interface ChiSoDienNuoc {
    _id?: string;
    idPhong: string | any;
    thang: string;
    chiSoDienCu: number;
    chiSoDienMoi: number;
    chiSoNuocCu: number;
    chiSoNuocMoi: number;
    createdAt?: string;
}

export interface GiaDienNuoc {
    _id?: string;
    ngayApDung: string;
    giaDien: number;
    giaNuoc: number;
}

export const utilityService = {
    getAllChiSos: async () => {
        const response = await api.get<ChiSoDienNuoc[]>("/chisodiennuoc");
        return response.data;
    },
    getLatestChiSoByPhong: async (idPhong: string) => {
        const response = await api.get<ChiSoDienNuoc>(`/chisodiennuoc/latest/${idPhong}`);
        return response.data;
    },
    createChiSo: async (data: ChiSoDienNuoc) => {
        const response = await api.post<ChiSoDienNuoc>("/chisodiennuoc", data);
        return response.data;
    },
    getLatestGia: async () => {
        const response = await api.get<GiaDienNuoc>("/giadiennuoc/latest");
        return response.data;
    },
    getAllGias: async () => {
        const response = await api.get<GiaDienNuoc[]>("/giadiennuoc/history");
        return response.data;
    },
    updateGia: async (data: GiaDienNuoc) => {
        const response = await api.post<GiaDienNuoc>("/giadiennuoc", data);
        return response.data;
    },
    deleteChiSo: async (id: string) => {
        const response = await api.delete(`/chisodiennuoc/${id}`);
        return response.data;
    },
    getChiSoLookup: async (idPhong: string, thang: string) => {
        const response = await api.get<ChiSoDienNuoc>(`/chisodiennuoc/lookup/${idPhong}?thang=${thang}`);
        return response.data;
    },
    getChiSoGanNhat: async (idPhong: string) => {
        const response = await api.get<ChiSoDienNuoc>(`/chisodiennuoc/latest/${idPhong}`);
        return response.data;
    }
};
