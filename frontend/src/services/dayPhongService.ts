import api from "./api";

export interface DayPhong {
    _id: string;
    soDay: string;
    tang: number;
    viTri: string;
    hinhAnh?: string;
    soPhongToiDa: number;
    createdAt: string;
}

export interface BulkCreateDayPhongParams {
    startFloor: number;
    endFloor: number;
    startRow: string;
    endRow: string;
    viTri?: string;
}

export const dayPhongService = {
    getAllDayPhongs: async () => {
        const response = await api.get<DayPhong[]>("/dayphong");
        return response.data;
    },
    createDayPhong: async (data: any) => {
        const response = await api.post<DayPhong>("/dayphong", data);
        return response.data;
    },
    bulkCreateDayPhongs: async (data: any) => {
        const response = await api.post<DayPhong[]>("/dayphong/bulk", data);
        return response.data;
    },
    updateDayPhong: async (id: string, data: any) => {
        const response = await api.put<DayPhong>(`/dayphong/${id}`, data);
        return response.data;
    },
    deleteDayPhong: async (id: string) => {
        const response = await api.delete(`/dayphong/${id}`);
        return response.data;
    },
};
