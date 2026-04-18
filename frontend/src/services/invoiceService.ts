import api from "./api";

export interface Invoice {
    _id: string;
    idHopDong: any; // Populated
    idKhach?: any;
    idPhong?: any;
    ngayThangNam: string;
    thangThanhToan?: string;
    hanThanhToan?: string;
    maThanhToan?: string;

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
    soTienDaThanhToan?: number;
    ngayThanhToan?: string | null;
    sepayTransactionId?: string;
    maThamChieuNganHang?: string;

    phuongThucThanhToan?: string;
    trangThai: "Chua_Thanh_Toan" | "Da_Thanh_Toan" | "Qua_Han";
    publicStatus?: "paid" | "unpaid" | "overdue";
    createdAt: string;
}

export interface InvoiceStatusResponse {
    status: "paid" | "unpaid" | "overdue";
    paidAt: string | null;
    amount: number;
}

export interface PublicInvoiceDetail {
    paymentCode: string;
    room: {
        id: string;
        roomNumber: string;
        roomName: string;
    } | null;
    month: string | null;
    amountDue: number;
    dueDate: string | null;
    status: "paid" | "unpaid" | "overdue";
    paidAt: string | null;
    bank: {
        code: string;
        accountNumber: string;
        accountName: string;
    } | null;
}

export interface InvoiceFilterParams {
    month?: string;
    roomId?: string;
    tenantId?: string;
    status?: "paid" | "unpaid" | "overdue" | "Da_Thanh_Toan" | "Chua_Thanh_Toan" | "Qua_Han";
    page?: number;
    limit?: number;
}

export interface LandlordInvoiceResponse {
    items: Invoice[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface PaymentReportBreakdownItem {
    invoiceId: string;
    roomId: string | null;
    roomName: string;
    roomNumber: string;
    tenantId: string | null;
    tenantName: string;
    amountDue: number;
    paidAmount: number;
    paymentCode: string;
    status: "paid" | "unpaid" | "overdue";
    paidAt: string | null;
    dueDate: string | null;
}

export interface PaymentReportTransaction {
    id: string;
    sepayId: string;
    paymentCode: string;
    transferAmount: number;
    transferType: string;
    gateway: string;
    referenceCode: string;
    transactionDate: string;
    result: string;
    roomName: string;
    tenantName: string;
    invoiceStatus: string;
}

export interface PaymentReportResponse {
    month: string;
    totalExpected: number;
    totalCollected: number;
    collectionRate: number;
    paidCount: number;
    unpaidCount: number;
    overdueCount: number;
    perRoomBreakdown: PaymentReportBreakdownItem[];
    transactions: PaymentReportTransaction[];
}

export interface GenerateInvoicesResponse {
    success: boolean;
    month: string;
    dueDate: string;
    createdCount: number;
    skippedCount: number;
    created: Array<{
        hoaDonId: string;
        roomId: string;
        roomName: string;
        tenantId: string;
        tenantName: string;
        amountDue: number;
        paymentCode: string;
    }>;
    skipped: Array<{
        hopDongId: string;
        hoaDonId?: string;
        reason: string;
    }>;
}

export interface RevenueStatisticsResponse {
    year: string;
    totalRevenue: number;
    revenueByMonth: Array<{
        month: string;
        revenue: number;
    }>;
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
    },
    generateInvoices: async (month: string) => {
        const response = await api.post<GenerateInvoicesResponse>("/invoices/generate", { month });
        return response.data;
    },
    getInvoiceStatusByCode: async (code: string) => {
        const response = await api.get<InvoiceStatusResponse>(`/invoices/${encodeURIComponent(code)}/status`);
        return response.data;
    },
    getPublicInvoiceByCode: async (code: string) => {
        const response = await api.get<PublicInvoiceDetail>(`/invoices/${encodeURIComponent(code)}/public`);
        return response.data;
    },
    getInvoices: async (params: InvoiceFilterParams) => {
        const response = await api.get<LandlordInvoiceResponse>("/invoices", { params });
        return response.data;
    },
    getPaymentsReport: async (month: string) => {
        const response = await api.get<PaymentReportResponse>("/payments/report", { params: { month } });
        return response.data;
    },
    exportPaymentsCsv: async (month: string) => {
        const response = await api.get<Blob>("/payments/export", {
            params: { month },
            responseType: "blob"
        });
        return response.data;
    },
    getRevenueStatistics: async (year: string) => {
        const response = await api.get<RevenueStatisticsResponse>("/payments/statistics", {
            params: { year }
        });
        return response.data;
    }
};
