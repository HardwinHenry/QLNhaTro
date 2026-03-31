import api from "./api";

export interface BookingRequest {
    _id: string;
    idKhach: {
        _id: string;
        hoVaTen: string;
        sdt: string;
    };
    idPhong: {
        _id: string;
        tenPhong: string;
        giaPhong: number;
    };
    idSlot?: string | any;
    ngayDat: string;
    trangThai: "Cho_Xac_Nhan" | "Da_Xac_Nhan" | "Da_Huy";
    ghiChu?: string;
    createdAt: string;
}

export const bookingService = {
    getAllBookings: async () => {
        const response = await api.get<BookingRequest[]>("/datphong");
        return response.data;
    },
    createBooking: async (data: { idPhong: string; ngayDat: string; idSlot?: string; ghiChu?: string }) => {
        const response = await api.post<BookingRequest>("/datphong", data);
        return response.data;
    },
    confirmBooking: async (id: string) => {
        const response = await api.put<{ message: string; success: boolean }>(`/datphong/${id}/confirm`);
        return response.data;
    },
    cancelBooking: async (id: string) => {
        const response = await api.put<{ message: string; success: boolean }>(`/datphong/${id}/cancel`);
        return response.data;
    },
    updateBooking: async (id: string, data: { ngayDat?: string; ghiChu?: string }) => {
        const response = await api.put<{ message: string; data: BookingRequest }>(`/datphong/${id}`, data);
        return response.data;
    },
    deleteBooking: async (id: string) => {
        const response = await api.delete<{ message: string; success: boolean }>(`/datphong/${id}`);
        return response.data;
    }
};
