import api from "./api";

export interface Invoice {
    _id: string;
    idHopDong: any; // Populated
    ngayThangNam: string;

    tienPhong: number;

    // Electricity
    chiSoDienCu: number;
    chiSoDienMoi: number;
    giaDien: number;
    tienDien: number;

    // Water
    chiSoNuocCu: number;
    chiSoNuocMoi: number;
    giaNuoc: number;
    tienNuoc: number;

    tienDichVu: number;
    tongTien: number;

    phuongThucThanhToan?: string;
    trangThai: "Chua_Thanh_Toan" | "Da_Thanh_Toan";
    createdAt: string;
}


export const invoiceService = {
    getAllHoaDons: async () => {
        const response = await api.get<Invoice[]>("/hoadon");
        return response.data;
    },
    createHoaDon: async (data: Partial<Invoice>) => {
        const response = await api.post<Invoice>("/hoadon", data);
        return response.data;
    },
    updateHoaDon: async (id: string, data: Partial<Invoice>) => {
        const response = await api.put<Invoice>(`/hoadon/${id}`, data);
        return response.data;
    },
    deleteHoaDon: async (id: string) => {
        const response = await api.delete(`/hoadon/${id}`);
        return response.data;
    },
    requestPayment: async (id: string) => {
        const response = await api.post<{ message: string; success: boolean }>(`/hoadon/${id}/request-payment`);
        return response.data;
    }
};
