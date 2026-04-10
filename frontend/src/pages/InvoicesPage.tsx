import { useEffect, useState } from "react";
import { Receipt, Search, Loader2, CheckCircle2, Clock, Plus, X, Calculator, Trash2, Edit2, CreditCard, LayoutTemplate, Settings } from "lucide-react";
import { invoiceService, type Invoice } from "../services/invoiceService";
import { contractService, type Contract } from "../services/contractService";
import { cauHinhService, type CauHinh } from "../services/cauHinhService";
import { useAuthStore } from "../store/authStore";
import { formatVi } from "../utils/dateFormatter";
import Swal from "sweetalert2";
import { utilityService } from "../services/utilityService";

export default function InvoicesPage() {
    const { user } = useAuthStore();
    const isAdmin = user?.vaiTro === "Chu_Tro";
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Setup Settings State
    const [cauHinh, setCauHinh] = useState<CauHinh | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [cfgNganHang, setCfgNganHang] = useState("");
    const [cfgSoTaiKhoan, setCfgSoTaiKhoan] = useState("");
    const [cfgChuTaiKhoan, setCfgChuTaiKhoan] = useState("");
    const [cfgDiaChi, setCfgDiaChi] = useState("");

    // Form state
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [selectedContract, setSelectedContract] = useState("");
    const [contractSearchTerm, setContractSearchTerm] = useState("");
    const [isContractDropdownOpen, setIsContractDropdownOpen] = useState(false);
    const [ngayThangNam, setNgayThangNam] = useState(new Date().toISOString().slice(0, 10));
    const [chiSoDien, setChiSoDien] = useState(0);
    const [chiSoNuoc, setChiSoNuoc] = useState(0);
    const [tienPhong, setTienPhong] = useState(0);
    const [chiSoDienCu, setChiSoDienCu] = useState(0);
    const [chiSoNuocCu, setChiSoNuocCu] = useState(0);
    const [giaDien, setGiaDien] = useState(0);
    const [giaNuoc, setGiaNuoc] = useState(0);
    const [tienDien, setTienDien] = useState(0);
    const [tienNuoc, setTienNuoc] = useState(0);
    const [tienDichVu, setTienDichVu] = useState(0);
    const [tongTien, setTongTien] = useState(0);

    const fetchInvoices = async () => {
        try {
            const data = await invoiceService.getAllHoaDons();
            setInvoices(data);
        } catch (error) {
            console.error("Lỗi khi tải hóa đơn:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
        const fetchContracts = async () => {
            const data = await contractService.getAllHopDongs();
            setContracts(data);
        };
        const fetchCauHinh = async () => {
            try {
                const data = await cauHinhService.getLatestCauHinh();
                if (data) {
                    setCauHinh(data);
                    setCfgNganHang(data.nganHang);
                    setCfgSoTaiKhoan(data.soTaiKhoan);
                    setCfgChuTaiKhoan(data.chuTaiKhoan);
                    setCfgDiaChi(data.diaChi || "");
                }
            } catch (err) { }
        };
        fetchContracts();
        fetchCauHinh();
    }, []);

    const handleContractChange = async (idHopDong: string) => {
        setSelectedContract(idHopDong);
    };

    // Update indices and prices when contract or date changes
    useEffect(() => {
        const updateReadings = async () => {
            if (!selectedContract) return;

            const contract = contracts.find(c => c._id === selectedContract);
            if (!contract) return;

            // 1. Sync Room Rent from Contract
            setTienPhong(contract.giaThue);

            // 2. Fetch Utility indices (Lookup this month or get latest from previous)
            const idPhong = contract.idPhong?._id || contract.idPhong;
            const invoiceDate = new Date(ngayThangNam);
            const invoiceMonth = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;

            const [lookup, giaData] = await Promise.all([
                utilityService.getChiSoLookup(idPhong, invoiceMonth),
                utilityService.getLatestGia()
            ]);

            // 3. Handle Indices
            if (lookup) {
                if (lookup.thang === invoiceMonth) {
                    setChiSoDien(lookup.chiSoDienMoi);
                    setChiSoDienCu(lookup.chiSoDienCu);
                    setChiSoNuoc(lookup.chiSoNuocMoi);
                    setChiSoNuocCu(lookup.chiSoNuocCu);
                } else {
                    // Logic from lookup: previous month record
                    setChiSoDien(lookup.chiSoDienMoi);
                    setChiSoDienCu(lookup.chiSoDienMoi);
                    setChiSoNuoc(lookup.chiSoNuocMoi);
                    setChiSoNuocCu(lookup.chiSoNuocMoi);
                }
            } else {
                // No records at all
                setChiSoDien(0);
                setChiSoDienCu(0);
                setChiSoNuoc(0);
                setChiSoNuocCu(0);
            }

            // 4. Sync Utility Prices from Global Config (Table)
            if (giaData) {
                setGiaDien(giaData.giaDien);
                setGiaNuoc(giaData.giaNuoc);
            }
        };

        updateReadings();
    }, [selectedContract, ngayThangNam, contracts]);

    // Auto calculate whenever relevant fields change
    useEffect(() => {
        const dienTieuThu = Math.max(0, chiSoDien - chiSoDienCu);
        const nuocTieuThu = Math.max(0, chiSoNuoc - chiSoNuocCu);

        const calculatedTienDien = dienTieuThu * giaDien;
        const calculatedTienNuoc = nuocTieuThu * giaNuoc;

        setTienDien(calculatedTienDien);
        setTienNuoc(calculatedTienNuoc);

        const total = (tienPhong || 0) + (calculatedTienDien || 0) + (calculatedTienNuoc || 0) + (tienDichVu || 0);
        setTongTien(total);
    }, [chiSoDien, chiSoDienCu, chiSoNuoc, chiSoNuocCu, giaDien, giaNuoc, tienPhong, tienDichVu]);

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: No past months
        const today = new Date();
        const firstDayOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const inputDate = new Date(ngayThangNam);
        const firstDayOfInputMonth = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1);

        if (firstDayOfInputMonth < firstDayOfThisMonth) {
            Swal.fire({
                icon: 'error',
                title: 'Ngày không hợp lệ',
                text: 'Không thể tạo hóa đơn cho các tháng trước tháng hiện tại.',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        // Validation: Sequential & Duplicate check
        const conflictInvoice = invoices.find(inv => {
            const invDate = new Date(inv.ngayThangNam);
            const invFirstDay = new Date(invDate.getFullYear(), invDate.getMonth(), 1);
            return (inv.idHopDong?._id === selectedContract) && (invFirstDay >= firstDayOfInputMonth);
        });

        if (conflictInvoice) {
            const conflictDate = new Date(conflictInvoice.ngayThangNam);
            const isSameMonth = conflictDate.getMonth() === inputDate.getMonth() && conflictDate.getFullYear() === inputDate.getFullYear();

            Swal.fire({
                icon: 'error',
                title: isSameMonth ? 'Hóa đơn đã tồn tại' : 'Thứ tự không hợp lệ',
                text: isSameMonth
                    ? 'Đã có hóa đơn cho tháng này cho hợp đồng này.'
                    : 'Không thể tạo hóa đơn cho tháng cũ khi đã có hóa đơn mới hơn cho hợp đồng này.',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        // Validation: Must be within contract term
        const contract = contracts.find(c => c._id === selectedContract);
        if (contract) {
            const startDate = new Date(contract.ngayBatDau);
            const endDate = contract.ngayKetThuc ? new Date(contract.ngayKetThuc) : null;

            if (inputDate < startDate || (endDate && inputDate > endDate)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Ngày không hợp lệ',
                    text: `Ngày lập phải nằm trong thời hạn hợp đồng (${formatVi(startDate)}${endDate ? ` - ${formatVi(endDate)}` : ""})`,
                    confirmButtonColor: '#2563eb'
                });
                return;
            }
        }

        // Validation: Indices (Strictly New > Old)
        if (chiSoDien <= chiSoDienCu) {
            Swal.fire({
                icon: 'error',
                title: 'Chỉ số không hợp lệ',
                text: 'Chỉ số điện mới phải LỚN HƠN chỉ số cũ (Điều kiện bắt buộc).',
                confirmButtonColor: '#2563eb'
            });
            return;
        }
        if (chiSoNuoc <= chiSoNuocCu) {
            Swal.fire({
                icon: 'error',
                title: 'Chỉ số không hợp lệ',
                text: 'Chỉ số nước mới phải LỚN HƠN chỉ số cũ (Điều kiện bắt buộc).',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        try {
            await invoiceService.createHoaDon({
                idHopDong: selectedContract,
                ngayThangNam,
                tienPhong,
                chiSoDienCu,
                chiSoDienMoi: chiSoDien,
                giaDien,
                tienDien,
                chiSoNuocCu,
                chiSoNuocMoi: chiSoNuoc,
                giaNuoc,
                tienNuoc,
                tienDichVu,
                tongTien: tongTien || (tienPhong + tienDien + tienNuoc + tienDichVu),
                trangThai: "Chua_Thanh_Toan"
            });
            Swal.fire({ icon: 'success', title: 'Thành công!', text: 'Tạo hóa đơn thành công', confirmButtonColor: '#2563eb' });
            setIsCreateModalOpen(false);
            fetchInvoices();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Thất bại!', text: 'Lỗi khi tạo hóa đơn', confirmButtonColor: '#2563eb' });
        }
    };


    const handleDeleteInvoice = async (id: string) => {
        const result = await Swal.fire({
            title: 'Bạn có chắc chắn?',
            text: 'Bạn có chắc chắn muốn xóa hóa đơn này? Hành động này không thể hoàn tác.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Đồng ý xóa',
            cancelButtonText: 'Hủy'
        });

        if (!result.isConfirmed) return;

        setIsDeleting(id);
        try {
            await invoiceService.deleteHoaDon(id);
            Swal.fire({ icon: 'success', title: 'Đã xóa!', text: 'Xóa hóa đơn thành công', confirmButtonColor: '#2563eb' });
            fetchInvoices();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Thất bại!', text: 'Lỗi khi xóa hóa đơn', confirmButtonColor: '#2563eb' });
        } finally {
            setIsDeleting(null);
        }
    };

    const handleConfirmPayment = async (id: string) => {
        const result = await Swal.fire({
            title: "Xác nhận thanh toán?",
            text: "Bạn có chắc chắn muốn xác nhận khách đã thanh toán hóa đơn này?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#10b981",
            cancelButtonColor: "#94a3b8",
            confirmButtonText: "Xác nhận",
            cancelButtonText: "Hủy",
        });

        if (result.isConfirmed) {
            try {
                await invoiceService.confirmPayment(id);
                fetchInvoices();
                Swal.fire("Thành công!", "Đã xác nhận thanh toán thành công.", "success");
            } catch (error) {
                Swal.fire("Lỗi!", "Không thể xác nhận thanh toán.", "error");
            }
        }
    };

    const handleOpenEdit = (invoice: Invoice) => {
        setCurrentInvoice(invoice);
        setSelectedContract(invoice.idHopDong?._id || "");
        setNgayThangNam(invoice.ngayThangNam.slice(0, 10));
        setChiSoDien(invoice.chiSoDienMoi);
        setChiSoDienCu(invoice.chiSoDienCu);
        setChiSoNuoc(invoice.chiSoNuocMoi);
        setChiSoNuocCu(invoice.chiSoNuocCu);
        setTienPhong(invoice.tienPhong);
        setGiaDien(invoice.giaDien);
        setGiaNuoc(invoice.giaNuoc);
        setTienDien(invoice.tienDien);
        setTienNuoc(invoice.tienNuoc);
        setTienDichVu(invoice.tienDichVu || 0);
        setTongTien(invoice.tongTien);
        setIsEditModalOpen(true);
    };

    const handleUpdateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentInvoice) return;

        // Validation: Indices (Strictly New > Old)
        if (chiSoDien <= chiSoDienCu) {
            Swal.fire({ icon: 'error', title: 'Lỗi!', text: 'Số điện mới phải lớn hơn số cũ', confirmButtonColor: '#2563eb' });
            return;
        }
        if (chiSoNuoc <= chiSoNuocCu) {
            Swal.fire({ icon: 'error', title: 'Lỗi!', text: 'Số nước mới phải lớn hơn số cũ', confirmButtonColor: '#2563eb' });
            return;
        }

        try {
            await invoiceService.updateHoaDon(currentInvoice._id, {
                ngayThangNam,
                chiSoDienMoi: chiSoDien,
                chiSoNuocMoi: chiSoNuoc,
                tienDien,
                tienNuoc,
                tienPhong,
                giaDien,
                giaNuoc,
                chiSoDienCu,
                chiSoNuocCu,
                tienDichVu,
                tongTien: tongTien || (tienPhong + tienDien + tienNuoc + tienDichVu)
            });
            Swal.fire({ icon: 'success', title: 'Thành công!', text: 'Cập nhật hóa đơn thành công', confirmButtonColor: '#2563eb' });
            setIsEditModalOpen(false);
            fetchInvoices();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Thất bại!', text: 'Lỗi khi cập nhật hóa đơn', confirmButtonColor: '#2563eb' });
        }
    };





    const handlePayment = (invoice: Invoice) => {
        const amount = invoice.tongTien || 0;
        const monthYear = formatVi(invoice.ngayThangNam, { month: '2-digit', year: 'numeric' });
        const description = `Thanh toan tien phong va dien nuoc thang ${monthYear} phong ${invoice.idHopDong?.idPhong?.tenPhong}`;
        const accountName = cauHinh?.chuTaiKhoan || "TRAN TRUONG DANG KHOA";
        const bankCode = cauHinh?.nganHang || "MB";
        const accountNo = cauHinh?.soTaiKhoan || "0987706342";

        const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;

        Swal.fire({
            title: 'Thanh toán trực tuyến',
            html: `
                <div class="flex flex-col items-center space-y-4">
                    <p class="text-sm text-slate-500">Mở ứng dụng ngân hàng và quét mã QR bên dưới để thanh toán.</p>
                    <div class="p-4 bg-white border-2 border-slate-100 rounded-3xl shadow-lg inline-block">
                        <img src="${qrUrl}" alt="VietQR" class="w-64 h-auto rounded-xl block mx-auto" />
                    </div>
                    <div class="text-left w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-4 space-y-2">
                        <div class="flex justify-between items-center"><span class="text-xs font-bold text-slate-400">Ngân hàng:</span> <span class="text-sm font-black text-slate-800">MBBank</span></div>
                        <div class="flex justify-between items-center"><span class="text-xs font-bold text-slate-400">Chủ tài khoản:</span> <span class="text-sm font-black text-slate-800">${accountName}</span></div>
                        <div class="flex justify-between items-center"><span class="text-xs font-bold text-slate-400">Số tài khoản:</span> <span class="text-sm font-black text-slate-800">${accountNo}</span></div>
                        <div class="flex justify-between items-center"><span class="text-xs font-bold text-slate-400">Số tiền:</span> <span class="text-sm font-black text-blue-600">${amount.toLocaleString('vi-VN')}đ</span></div>
                        <div class="flex justify-between items-center"><span class="text-xs font-bold text-slate-400">Nội dung:</span> <span class="text-xs font-black text-slate-800 truncate ml-4" title="${description}">${description}</span></div>
                    </div>
                    <p class="text-xs text-red-500 font-bold text-center mt-2">Lưu ý: Bạn cần quét theo đúng số tiền và nội dung chuyển khoản tự động.</p>
                </div>
            `,
            showCloseButton: true,
            showConfirmButton: false,
            width: '28rem',
            customClass: {
                popup: 'rounded-[2.5rem] p-4 sm:p-6'
            }
        });
    };

    const handleMarkAsPaid = async (id: string) => {
        try {
            await invoiceService.updateHoaDon(id, { trangThai: "Da_Thanh_Toan" });
            Swal.fire({ icon: 'success', title: 'Thành công!', text: 'Đã xác nhận thu tiền thành công', confirmButtonColor: '#2563eb' });
            fetchInvoices();
            setIsDetailsModalOpen(false);
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Thất bại!', text: 'Lỗi khi cập nhật hóa đơn', confirmButtonColor: '#2563eb' });
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Da_Thanh_Toan":
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "Chua_Thanh_Toan":
                return "bg-amber-100 text-amber-700 border-amber-200";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const getStatusLabel = (status: string) => {
        return status === "Da_Thanh_Toan" ? "Đã thanh toán" : "Chưa thanh toán";
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = await cauHinhService.updateCauHinh({
                nganHang: cfgNganHang,
                soTaiKhoan: cfgSoTaiKhoan,
                chuTaiKhoan: cfgChuTaiKhoan,
                diaChi: cfgDiaChi
            });
            setCauHinh(data);
            Swal.fire({ icon: 'success', title: 'Thành công!', text: 'Lưu cấu hình thanh toán thành công', confirmButtonColor: '#2563eb' });
            setIsSettingsModalOpen(false);
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Thất bại!', text: 'Lỗi khi lưu cấu hình', confirmButtonColor: '#2563eb' });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Đang tải danh sách hóa đơn...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Hóa đơn</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Quản lý các khoản thanh toán của bạn</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">z
                    {isAdmin && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="flex items-center justify-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <Settings size={18} />
                                Thiết lập
                            </button>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-black transition-all shadow-lg shadow-slate-200"
                            >
                                <Plus size={18} />
                                Tạo hóa đơn
                            </button>
                        </div>
                    )}
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm hóa đơn..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-full sm:w-64 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Hóa đơn</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Phòng</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Thời gian</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Tổng tiền</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Trạng thái</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoices.length > 0 ? (
                                invoices.map((invoice) => (
                                    <tr key={invoice._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                    <Receipt size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">#INV-{invoice._id.slice(-6).toUpperCase()}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">Tạo ngày: {formatVi(invoice.createdAt)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700">{invoice.idHopDong?.idPhong?.tenPhong || "N/A"}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-600">
                                                {formatVi(invoice.ngayThangNam, { month: "2-digit", year: "numeric" })}
                                            </p>
                                        </td>

                                        <td className="px-6 py-4">
                                            <p className="text-sm font-black text-blue-600">{(invoice.tongTien ?? 0).toLocaleString("vi-VN")}đ</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${getStatusStyle(invoice.trangThai)}`}>
                                                {invoice.trangThai === "Da_Thanh_Toan" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                {getStatusLabel(invoice.trangThai)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setCurrentInvoice(invoice);
                                                        setIsDetailsModalOpen(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-bold transition-colors"
                                                >
                                                    Chi tiết
                                                </button>
                                                {(!isAdmin && invoice.trangThai === "Chua_Thanh_Toan") && (
                                                    <button
                                                        onClick={() => handlePayment(invoice)}
                                                        className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1 rounded-xl text-xs font-black hover:bg-black transition-all shadow-md shadow-blue-100"
                                                    >
                                                        <CreditCard size={12} />
                                                        Thanh toán
                                                    </button>
                                                )}
                                                {isAdmin && (
                                                    <div className="flex items-center gap-1">
                                                        {invoice.trangThai === "Chua_Thanh_Toan" && (
                                                            <button
                                                                onClick={() => handleConfirmPayment(invoice._id)}
                                                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                                title="Xác nhận thanh toán"
                                                            >
                                                                <CheckCircle2 size={16} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleOpenEdit(invoice)}
                                                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="Sửa"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteInvoice(invoice._id)}
                                                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Xóa"
                                                            disabled={isDeleting === invoice._id}
                                                        >
                                                            {isDeleting === invoice._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200">
                                                <Receipt size={32} className="text-slate-300" />
                                            </div>
                                            <p className="text-slate-400 font-medium">Bạn chưa có hóa đơn nào.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Invoice Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-xl max-h-[90vh] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
                                <Plus size={24} className="text-blue-600" />
                                Tạo hóa đơn mới
                            </h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateInvoice} className="p-4 sm:p-8 space-y-5 sm:space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2 relative">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Hợp đồng / Phòng</label>
                                    <div className="relative">
                                        <LayoutTemplate className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                            placeholder="Nhập số phòng hoặc tên khách..."
                                            value={contractSearchTerm}
                                            onChange={(e) => {
                                                setContractSearchTerm(e.target.value);
                                                setIsContractDropdownOpen(true);
                                                if (!e.target.value) setSelectedContract("");
                                            }}
                                            onFocus={() => setIsContractDropdownOpen(true)}
                                            required={!selectedContract}
                                        />
                                    </div>

                                    {isContractDropdownOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                            {contracts.filter(c =>
                                                (c.idPhong?.tenPhong + " " + c.idKhach?.hoVaTen).toLowerCase().includes(contractSearchTerm.toLowerCase())
                                            ).length > 0 ? (
                                                contracts.filter(c =>
                                                    (c.idPhong?.tenPhong + " " + c.idKhach?.hoVaTen).toLowerCase().includes(contractSearchTerm.toLowerCase())
                                                ).map(c => (
                                                    <button
                                                        key={c._id}
                                                        type="button"
                                                        className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex flex-col gap-0.5 transition-colors border-b border-slate-50 last:border-0"
                                                        onClick={() => {
                                                            handleContractChange(c._id);
                                                            setContractSearchTerm(`${c.idPhong?.tenPhong} - ${c.idKhach?.hoVaTen}`);
                                                            setIsContractDropdownOpen(false);
                                                        }}
                                                    >
                                                        <span className="font-bold text-slate-800">{c.idPhong?.tenPhong}</span>
                                                        <span className="text-xs text-slate-500">{c.idKhach?.hoVaTen}</span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-3 text-sm text-slate-400 italic">Không tìm thấy hợp đồng...</div>
                                            )}
                                        </div>
                                    )}
                                    <input type="hidden" value={selectedContract} required />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ngày lập</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={ngayThangNam}
                                        onChange={(e) => setNgayThangNam(e.target.value)}
                                        min={new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tiền phòng (vnđ)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none"
                                        value={tienPhong}
                                        readOnly
                                    />
                                </div>

                                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-200/50">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chỉ số điện (Cũ)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed outline-none transition-all"
                                            value={chiSoDienCu}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Chỉ số điện (Mới nhất)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all font-bold"
                                            value={chiSoDien}
                                            onChange={(e) => setChiSoDien(Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-200/50">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chỉ số nước (Cũ)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed outline-none transition-all"
                                            value={chiSoNuocCu}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Chỉ số nước (Mới nhất)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 outline-none transition-all font-bold"
                                            value={chiSoNuoc}
                                            onChange={(e) => setChiSoNuoc(Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col gap-2">
                                    <div className="flex items-center justify-between font-medium">
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Tiêu thụ Điện</p>
                                        <span className="text-sm font-black text-blue-600">+{Math.max(0, chiSoDien - chiSoDienCu)} kWh</span>
                                    </div>
                                    <div className="text-[10px] text-blue-500 font-bold text-right border-t border-blue-100 pt-1">
                                        {(Math.max(0, chiSoDien - chiSoDienCu) * giaDien).toLocaleString('vi-VN')}vnđ
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col gap-2">
                                    <div className="flex items-center justify-between font-medium">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Tiêu thụ Nước</p>
                                        <span className="text-sm font-black text-emerald-600">+{Math.max(0, chiSoNuoc - chiSoNuocCu)} m³</span>
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-bold text-right border-t border-emerald-100 pt-1">
                                        {(Math.max(0, chiSoNuoc - chiSoNuocCu) * giaNuoc).toLocaleString('vi-VN')}vnđ
                                    </div>
                                </div>

                                <div className="sm:col-span-2 p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cấu trúc hóa đơn</p>
                                        <Calculator size={16} className="text-blue-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm"><span className="text-slate-400">Tiền phòng:</span> <span className="font-bold">{(tienPhong || 0).toLocaleString('vi-VN')}đ</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-400">Tiền điện:</span> <span className="font-bold">{(tienDien || 0).toLocaleString('vi-VN')}đ</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-400">Tiền nước:</span> <span className="font-bold">{(tienNuoc || 0).toLocaleString('vi-VN')}đ</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-400">Dịch vụ:</span> <span className="font-bold">{(tienDichVu || 0).toLocaleString('vi-VN')}đ</span></div>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                        <span className="text-xs font-black text-blue-400 uppercase tracking-tighter">Tổng cộng tháng này:</span>
                                        <span className="text-3xl font-black">{tongTien.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100 sm:col-span-2">
                                    <h3 className="text-sm font-bold text-purple-700 flex items-center gap-2">
                                        <Plus size={16} /> Phí dịch vụ khác (vnđ)
                                    </h3>
                                    <input
                                        type="number"
                                        className="w-full bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none transition-all"
                                        placeholder="Phí vệ sinh, wifi, rác..."
                                        value={tienDichVu}
                                        onChange={(e) => setTienDichVu(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-3xl shadow-2xl transition-all shadow-slate-200 flex items-center justify-center gap-2">
                                <Plus size={18} />
                                Tạo và Lưu hóa đơn
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Invoice Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-xl max-h-[90vh] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
                                <Edit2 size={24} className="text-blue-600" />
                                Chỉnh sửa hóa đơn
                            </h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateInvoice} className="p-4 sm:p-8 space-y-5 sm:space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Hợp đồng / Phòng</label>
                                    <input
                                        className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none text-slate-500 cursor-not-allowed"
                                        value={`${currentInvoice?.idHopDong?.idPhong?.tenPhong} - ${currentInvoice?.idHopDong?.idKhach?.hoVaTen}`}
                                        disabled
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ngày lập</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={ngayThangNam}
                                        onChange={(e) => setNgayThangNam(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tiền phòng (vnđ)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none text-slate-500 cursor-not-allowed"
                                        value={tienPhong}
                                        readOnly
                                    />
                                </div>

                                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-200/50">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chỉ số điện (Cũ)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed outline-none transition-all"
                                            value={chiSoDienCu}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Chỉ số điện (Mới nhất)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all font-bold"
                                            value={chiSoDien}
                                            onChange={(e) => setChiSoDien(Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-200/50">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chỉ số nước (Cũ)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed outline-none transition-all"
                                            value={chiSoNuocCu}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Chỉ số nước (Mới nhất)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 outline-none transition-all font-bold"
                                            value={chiSoNuoc}
                                            onChange={(e) => setChiSoNuoc(Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col gap-2">
                                    <div className="flex items-center justify-between font-medium">
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Tiêu thụ Điện</p>
                                        <span className="text-sm font-black text-blue-600">+{Math.max(0, chiSoDien - chiSoDienCu)} kWh</span>
                                    </div>
                                    <div className="text-[10px] text-blue-500 font-bold text-right border-t border-blue-100 pt-1">
                                        {(Math.max(0, chiSoDien - chiSoDienCu) * giaDien).toLocaleString('vi-VN')}vnđ
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col gap-2">
                                    <div className="flex items-center justify-between font-medium">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Tiêu thụ Nước</p>
                                        <span className="text-sm font-black text-emerald-600">+{Math.max(0, chiSoNuoc - chiSoNuocCu)} m³</span>
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-bold text-right border-t border-emerald-100 pt-1">
                                        {(Math.max(0, chiSoNuoc - chiSoNuocCu) * giaNuoc).toLocaleString('vi-VN')}vnđ
                                    </div>
                                </div>

                                <div className="sm:col-span-2 p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cấu trúc hóa đơn</p>
                                        <Calculator size={16} className="text-blue-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm"><span className="text-slate-400">Tiền phòng:</span> <span className="font-bold">{(tienPhong || 0).toLocaleString('vi-VN')}đ</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-400">Tiền điện:</span> <span className="font-bold">{(tienDien || 0).toLocaleString('vi-VN')}đ</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-400">Tiền nước:</span> <span className="font-bold">{(tienNuoc || 0).toLocaleString('vi-VN')}đ</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-400">Dịch vụ:</span> <span className="font-bold">{(tienDichVu || 0).toLocaleString('vi-VN')}đ</span></div>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                        <span className="text-xs font-black text-blue-400 uppercase tracking-tighter">Tổng cộng tháng này:</span>
                                        <span className="text-3xl font-black">{tongTien.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                </div>
                                <div className="space-y-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100 sm:col-span-2">
                                    <h3 className="text-sm font-bold text-purple-700 flex items-center gap-2">
                                        <Plus size={16} /> Phí dịch vụ khác (vnđ)
                                    </h3>
                                    <input
                                        type="number"
                                        className="w-full bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none transition-all"
                                        placeholder="Phí vệ sinh, wifi, rác..."
                                        value={tienDichVu}
                                        onChange={(e) => setTienDichVu(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-3xl shadow-2xl transition-all shadow-blue-100 flex items-center justify-center gap-2">
                                <Edit2 size={18} />
                                Cập nhật hóa đơn
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Details Invoice Modal */}
            {isDetailsModalOpen && currentInvoice && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300 text-slate-800">
                    <div className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
                        {/* Header */}
                        <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <Receipt size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">Chi tiết hóa đơn</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mã HĐ: #INV-{currentInvoice!._id.slice(-8).toUpperCase()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="p-3 hover:bg-slate-200 rounded-2xl transition-all border border-transparent hover:border-slate-300 text-slate-400"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 sm:p-8 lg:p-10 space-y-8 sm:space-y-10 overflow-y-auto custom-scrollbar flex-1">
                            {/* Status and Info Grid */}
                            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Thời gian lập</p>
                                    <p className="text-lg font-bold">Tháng {new Date(currentInvoice!.ngayThangNam).getMonth() + 1}, {new Date(currentInvoice!.ngayThangNam).getFullYear()}</p>
                                    <p className="text-xs text-slate-500">Người lập: Quản trị viên</p>
                                </div>
                                <div className="text-right space-y-2">
                                    <span className={`inline-flex items-center gap-2 px-6 py-2 rounded-2xl text-xs font-black border shadow-sm ${getStatusStyle(currentInvoice!.trangThai)}`}>
                                        {currentInvoice!.trangThai === "Da_Thanh_Toan" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                        {getStatusLabel(currentInvoice!.trangThai).toUpperCase()}
                                    </span>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Ngày tạo: {formatVi(currentInvoice!.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            {/* Tenant and Room Details */}
                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row gap-10">
                                <div className="flex-1 space-y-4 border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-10">
                                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Thông tin khách thuê</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-lg font-black text-blue-600 shadow-sm border border-slate-200">
                                            {currentInvoice!.idHopDong?.idKhach?.hoVaTen?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-700 text-lg">{currentInvoice!.idHopDong?.idKhach?.hoVaTen}</p>
                                            <p className="text-xs text-slate-500 font-medium">{currentInvoice!.idHopDong?.idKhach?.soDienThoai}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-4">Vị trí phòng</h4>
                                    <div className="space-y-1">
                                        <p className="text-xl font-black text-slate-800">{currentInvoice!.idHopDong?.idPhong?.tenPhong}</p>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dãy {currentInvoice!.idHopDong?.idPhong?.idDayPhong?.soDay} - {currentInvoice!.idHopDong?.idPhong?.idDayPhong?.viTri}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Billing Table */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                    <Calculator className="text-blue-600" size={18} />
                                    Bảng kê chi tiết
                                </h3>
                                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                                    <table className="w-full min-w-[600px] text-left">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Mục chi phí</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Chi tiết sử dụng</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {/* Room Rent */}
                                            <tr className="group">
                                                <td className="px-6 py-5">
                                                    <p className="font-bold text-slate-700">Tiền phòng</p>
                                                    <p className="text-[10px] text-slate-400">Giá cố định hàng tháng</p>
                                                </td>
                                                <td className="px-6 py-5 text-right font-medium text-slate-500">1 tháng</td>
                                                <td className="px-6 py-5 text-right font-black text-slate-800">{(currentInvoice!.tienPhong ?? 0).toLocaleString("vi-VN")}đ</td>
                                            </tr>
                                            {/* Electricity */}
                                            <tr>
                                                <td className="px-6 py-5 text-slate-700">
                                                    <p className="font-bold">Tiền điện</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">Cũ: {currentInvoice!.chiSoDienCu || 0}</span>
                                                        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Mới: {currentInvoice!.chiSoDienMoi || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right font-medium text-slate-500">
                                                    <p>{(currentInvoice!.chiSoDienMoi || 0) - (currentInvoice!.chiSoDienCu || 0)} kWh</p>
                                                    <p className="text-[10px]">x {currentInvoice!.giaDien?.toLocaleString("vi-VN") || 0}đ</p>
                                                </td>
                                                <td className="px-6 py-5 text-right font-black text-slate-800">{currentInvoice!.tienDien?.toLocaleString("vi-VN") || 0}đ</td>
                                            </tr>
                                            {/* Water */}
                                            <tr>
                                                <td className="px-6 py-5 text-slate-700">
                                                    <p className="font-bold">Tiền nước</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">Cũ: {currentInvoice!.chiSoNuocCu || 0}</span>
                                                        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Mới: {currentInvoice!.chiSoNuocMoi || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right font-medium text-slate-500">
                                                    <p>{(currentInvoice!.chiSoNuocMoi || 0) - (currentInvoice!.chiSoNuocCu || 0)} m³</p>
                                                    <p className="text-[10px]">x {currentInvoice!.giaNuoc?.toLocaleString("vi-VN") || 0}đ</p>
                                                </td>
                                                <td className="px-6 py-5 text-right font-black text-slate-800">{currentInvoice!.tienNuoc?.toLocaleString("vi-VN") || 0}đ</td>
                                            </tr>
                                            {/* Service Fee */}
                                            {currentInvoice!.tienDichVu > 0 && (
                                                <tr className="bg-purple-50/30">
                                                    <td className="px-6 py-5 text-slate-700">
                                                        <p className="font-bold">Phí dịch vụ khác</p>
                                                        <p className="text-[10px] text-slate-400">Vệ sinh, wifi, rác...</p>
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-medium text-slate-500">-</td>
                                                    <td className="px-6 py-5 text-right font-black text-slate-800">{currentInvoice!.tienDichVu.toLocaleString("vi-VN")}đ</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-blue-600 text-white">
                                                <td className="px-6 py-6 font-black text-lg uppercase tracking-widest">Tổng cộng</td>
                                                <td colSpan={2} className="px-6 py-6 text-right font-black text-2xl sm:text-3xl">
                                                    {(currentInvoice!.tongTien ?? 0).toLocaleString("vi-VN")}<span className="text-sm ml-1 opacity-70 italic font-medium">vnđ</span>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-4 sm:p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="flex-1 bg-slate-900 hover:bg-black text-white font-black py-4 rounded-3xl shadow-xl transition-all active:scale-95"
                            >
                                Đóng hóa đơn
                            </button>
                            {(!isAdmin && currentInvoice!.trangThai === "Chua_Thanh_Toan") && (
                                <button
                                    onClick={() => handlePayment(currentInvoice!)}
                                    className="px-10 bg-blue-600 text-white font-black py-4 rounded-3xl shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-2 hover:bg-black"
                                >
                                    <CreditCard size={18} /> Thanh toán ngay
                                </button>
                            )}
                            {(isAdmin && currentInvoice!.trangThai === "Chua_Thanh_Toan") && (
                                <button
                                    onClick={() => handleMarkAsPaid(currentInvoice!._id)}
                                    className="px-10 bg-emerald-600 text-white font-black py-4 rounded-3xl shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center gap-2 hover:bg-emerald-700 whitespace-nowrap"
                                >
                                    <CheckCircle2 size={18} /> Xác nhận đã thu tiền
                                </button>
                            )}
                            <button className="px-10 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-bold py-4 rounded-3xl transition-all shadow-sm active:scale-95 flex items-center gap-2">
                                <Receipt size={18} /> In hóa đơn
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Settings Modal */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
                                <Settings size={24} className="text-slate-600" />
                                Thiết lập Thanh toán
                            </h2>
                            <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveSettings} className="p-4 sm:p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tên mã ngân hàng (Viết tắt)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        placeholder="Ví dụ: MB, VCB, TCB..."
                                        value={cfgNganHang}
                                        onChange={(e) => setCfgNganHang(e.target.value)}
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium mt-1">Viết mã viết tắt như MB, VCB, ICB, ACB, VPB, VPB, TCB, VPB.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Số tài khoản</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={cfgSoTaiKhoan}
                                        onChange={(e) => setCfgSoTaiKhoan(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tên chủ tài khoản (Không dấu)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all uppercase"
                                        value={cfgChuTaiKhoan}
                                        onChange={(e) => setCfgChuTaiKhoan(e.target.value.toUpperCase())}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-3xl shadow-2xl transition-all shadow-blue-100 flex items-center justify-center gap-2">
                                Lưu thiết lập
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
