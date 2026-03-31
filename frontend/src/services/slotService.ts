import api from "./api";

export interface BookingSlot {
    _id: string;
    thoiGian: string;
    trangThai: "Trong" | "Da_Dat";
    ghiChu?: string;
    createdAt: string;
}

export const slotService = {
    getAllSlots: async () => {
        const response = await api.get<BookingSlot[]>("/lich-xem-phong");
        return response.data;
    },
    createSlot: async (data: { thoiGian: string; ghiChu?: string }) => {
        const response = await api.post<BookingSlot>("/lich-xem-phong", data);
        return response.data;
    },
    deleteSlot: async (id: string) => {
        const response = await api.delete<{ message: string; success: boolean }>(`/lich-xem-phong/${id}`);
        return response.data;
    }
};
