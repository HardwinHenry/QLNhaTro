import api from "./api";

export interface Room {
    _id: string;
    idPhong: string;
    idDayPhong?: any; // Populated Object or ID
    tenPhong: string;
    giaPhong: number;
    dienTich: number;
    sucChua: number;
    moTa?: string;
    loaiPhong?: string;
    trangThai: "Trong" | "Da_Thue";
    hinhAnh: string | string[];
    vatTu?: any[]; // Populated Objects or IDs
    khachThue?: any; // Populated Object (User schema)
}


export const roomService = {
    getAllPhongs: async (params?: any) => {
        const response = await api.get<Room[]>("/phong", { params });
        return response.data;
    },
    getPhongById: async (id: string) => {
        const response = await api.get<Room>(`/phong/${id}`);
        return response.data;
    },
    createPhong: async (data: FormData | Partial<Room>) => {
        const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
        const response = await api.post<Room>("/phong", data, { headers });
        return response.data;
    },
    updatePhong: async (id: string, data: FormData | Partial<Room>) => {
        const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
        const response = await api.put<Room>(`/phong/${id}`, data, { headers });
        return response.data;
    },
    deletePhong: async (id: string) => {
        const response = await api.delete(`/phong/${id}`);
        return response.data;
    },
};
