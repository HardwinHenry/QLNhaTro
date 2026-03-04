import api from "./api";

export interface VatTu {
    _id: string;
    tenVatTu: string;
    donGia: number;
    createdAt: string;
}

export const vatTuService = {
    getAllVatTus: async () => {
        const response = await api.get<VatTu[]>("/vattu");
        return response.data;
    },
    createVatTu: async (data: Partial<VatTu>) => {
        const response = await api.post<VatTu>("/vattu", data);
        return response.data;
    },
    updateVatTu: async (id: string, data: Partial<VatTu>) => {
        const response = await api.put<VatTu>(`/vattu/${id}`, data);
        return response.data;
    },
    deleteVatTu: async (id: string) => {
        const response = await api.delete(`/vattu/${id}`);
        return response.data;
    },
};
