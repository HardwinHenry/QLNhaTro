import { useEffect, useState } from "react";
import { Receipt, Search, Loader2, CheckCircle2, Clock, Plus, X, Send, Calculator, Trash2, Edit2, QrCode } from "lucide-react";
import { invoiceService, type Invoice } from "../services/invoiceService";
import { contractService, type Contract } from "../services/contractService";
import { utilityService } from "../services/utilityService";
import { useAuthStore } from "../store/authStore";
import Swal from "sweetalert2";

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

    // Form state
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [selectedContract, setSelectedContract] = useState("");
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
        fetchContracts();
    }, []);

    const handleContractChange = async (idHopDong: string) => {
        setSelectedContract(idHopDong);
    };

    // Update indices and prices when contract or date changes
    useEffect(() => {
        const updateReadings = async () => {
            if (!selectedContract) return;

            const contract = contracts.find(c => c._id === selectedContract);
            if (contract) {
                setTienPhong(contract.giaThue);

                const idPhong = contract.idPhong?._id || contract.idPhong;
                if (idPhong) {
                    const latest = await utilityService.getLatestChiSoByPhong(idPhong);
                    if (latest) {
                        const invoiceDate = new Date(ngayThangNam);
                        const invoiceMonth = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;

                        if (latest.thang === invoiceMonth) {
                            setChiSoDien(latest.chiSoDienMoi);
                            setChiSoDienCu(latest.chiSoDienCu);
                            setChiSoNuoc(latest.chiSoNuocMoi);
                            setChiSoNuocCu(latest.chiSoNuocCu);
                        } else {
                            setChiSoDien(latest.chiSoDienMoi);
                            setChiSoDienCu(latest.chiSoDienMoi);
                            setChiSoNuoc(latest.chiSoNuocMoi);
                            setChiSoNuocCu(latest.chiSoNuocMoi);
                        }
                    }
                }

                const giaData = await utilityService.getLatestGia();
                if (giaData) {
                    setGiaDien(contract.giaDien || giaData.giaDien);
                    setGiaNuoc(contract.giaNuoc || giaData.giaNuoc);
                }
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

        const total = tienPhong + calculatedTienDien + calculatedTienNuoc + (Number(tienDichVu) || 0);
        setTongTien(total);
    }, [chiSoDien, chiSoDienCu, chiSoNuoc, chiSoNuocCu, giaDien, giaNuoc, tienPhong, tienDichVu]);

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
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

    const handleRequestPayment = async (id: string) => {
        try {
            const res = await invoiceService.requestPayment(id);
            Swal.fire({ icon: 'info', title: 'Thông báo', text: res.message, confirmButtonColor: '#2563eb' });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Thất bại!', text: 'Lỗi khi gửi yêu cầu', confirmButtonColor: '#2563eb' });
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
        setTienDichVu(invoice.tienDichVu);
        setTongTien(invoice.tongTien);
        setIsEditModalOpen(true);
    };

    const handleUpdateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentInvoice) return;

        try {
            await invoiceService.updateHoaDon(currentInvoice._id, {
                ngayThangNam,
                chiSoDienMoi: chiSoDien,
                chiSoNuocMoi: chiSoNuoc,
                tienDichVu,
                tongTien
            });
            Swal.fire({ icon: 'success', title: 'Thành công!', text: 'Cập nhật hóa đơn thành công', confirmButtonColor: '#2563eb' });
            setIsEditModalOpen(false);
            fetchInvoices();
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
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {isAdmin && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-black transition-all shadow-lg shadow-slate-200"
                        >
                            <Plus size={18} />
                            Tạo hóa đơn
                        </button>
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
                                                    <p className="text-[10px] text-slate-400 font-medium">Tạo ngày: {new Date(invoice.createdAt).toLocaleDateString("vi-VN")}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700">{invoice.idHopDong?.idPhong?.tenPhong || "N/A"}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-600">
                                                {new Date(invoice.ngayThangNam).toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" })}
                                            </p>
                                        </td>

                                        <td className="px-6 py-4">
                                            <p className="text-sm font-black text-blue-600">{invoice.tongTien.toLocaleString("vi-VN")}đ</p>
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
                                                {isAdmin && (
                                                    <div className="flex items-center gap-1">
                                                        {invoice.trangThai === "Chua_Thanh_Toan" && (
                                                            <button
                                                                onClick={() => handleRequestPayment(invoice._id)}
                                                                className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg text-xs font-black hover:bg-amber-100 transition-all border border-amber-200"
                                                                title="Gửi yêu cầu thanh toán"
                                                            >
                                                                <Send size={12} />
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
                                                            disabled={isDeleting === invoice._id}
                                                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Xóa"
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
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Hợp đồng / Phòng</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={selectedContract}
                                        onChange={(e) => handleContractChange(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Chọn hợp đồng --</option>
                                        {contracts.map(c => (
                                            <option key={c._id} value={c._id}>{c.idPhong?.tenPhong} - {c.idKhach?.hoVaTen}</option>
                                        ))}
                                    </select>
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
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none"
                                        value={tienPhong}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Chỉ số điện (mới nhất)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={chiSoDien}
                                        onChange={(e) => setChiSoDien(Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Chỉ số nước (mới nhất)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={chiSoNuoc}
                                        onChange={(e) => setChiSoNuoc(Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phụ phí / Dịch vụ</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={tienDichVu}
                                        onChange={(e) => setTienDichVu(Number(e.target.value))}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tổng tiền</label>
                                    <input
                                        type="number"
                                        className="w-full bg-blue-50 border border-blue-200 text-blue-700 font-black rounded-2xl px-4 py-3 text-sm outline-none"
                                        value={tongTien}
                                        readOnly
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

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Chỉ số điện (mới nhất)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={chiSoDien}
                                        onChange={(e) => setChiSoDien(Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Chỉ số nước (mới nhất)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={chiSoNuoc}
                                        onChange={(e) => setChiSoNuoc(Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phụ phí / Dịch vụ</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={tienDichVu}
                                        onChange={(e) => setTienDichVu(Number(e.target.value))}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tổng tiền</label>
                                    <input
                                        type="number"
                                        className="w-full bg-blue-50 border border-blue-200 text-blue-700 font-black rounded-2xl px-4 py-3 text-sm outline-none"
                                        value={tongTien}
                                        readOnly
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
                    <div className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
                        {/* Header */}
                        <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <Receipt size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">Chi tiết hóa đơn</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mã HĐ: #INV-{currentInvoice._id.slice(-8).toUpperCase()}</p>
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
                                    <p className="text-lg font-bold">Tháng {new Date(currentInvoice.ngayThangNam).getMonth() + 1}, {new Date(currentInvoice.ngayThangNam).getFullYear()}</p>
                                    <p className="text-xs text-slate-500">Người lập: Quản trị viên</p>
                                </div>
                                <div className="text-right space-y-2">
                                    <span className={`inline-flex items-center gap-2 px-6 py-2 rounded-2xl text-xs font-black border shadow-sm ${getStatusStyle(currentInvoice.trangThai)}`}>
                                        {currentInvoice.trangThai === "Da_Thanh_Toan" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                        {getStatusLabel(currentInvoice.trangThai).toUpperCase()}
                                    </span>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Ngày tạo: {new Date(currentInvoice.createdAt).toLocaleString("vi-VN")}</p>
                                </div>
                            </div>

                            {/* Tenant and Room Details */}
                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row gap-10">
                                <div className="flex-1 space-y-4 border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-10">
                                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Thông tin khách thuê</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-lg font-black text-blue-600 shadow-sm border border-slate-200">
                                            {currentInvoice.idHopDong?.idKhach?.hoVaTen?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-700 text-lg">{currentInvoice.idHopDong?.idKhach?.hoVaTen}</p>
                                            <p className="text-xs text-slate-500 font-medium">{currentInvoice.idHopDong?.idKhach?.soDienThoai}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-4">Vị trí phòng</h4>
                                    <div className="space-y-1">
                                        <p className="text-xl font-black text-slate-800">{currentInvoice.idHopDong?.idPhong?.tenPhong}</p>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dãy {currentInvoice.idHopDong?.idPhong?.idDayPhong?.soDay} - {currentInvoice.idHopDong?.idPhong?.idDayPhong?.viTri}</p>
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
                                    <table className="w-full min-w-[720px] text-left">
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
                                                <td className="px-6 py-5 text-right font-black text-slate-800">{currentInvoice.tienPhong?.toLocaleString("vi-VN")}đ</td>
                                            </tr>
                                            {/* Electricity */}
                                            <tr>
                                                <td className="px-6 py-5 text-slate-700">
                                                    <p className="font-bold">Tiền điện</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">Cũ: {currentInvoice.chiSoDienCu || 0}</span>
                                                        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Mới: {currentInvoice.chiSoDienMoi || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right font-medium text-slate-500">
                                                    <p>{(currentInvoice.chiSoDienMoi || 0) - (currentInvoice.chiSoDienCu || 0)} kWh</p>
                                                    <p className="text-[10px]">x {currentInvoice.giaDien?.toLocaleString("vi-VN") || 0}đ</p>
                                                </td>
                                                <td className="px-6 py-5 text-right font-black text-slate-800">{currentInvoice.tienDien?.toLocaleString("vi-VN") || 0}đ</td>
                                            </tr>
                                            {/* Water */}
                                            <tr>
                                                <td className="px-6 py-5 text-slate-700">
                                                    <p className="font-bold">Tiền nước</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">Cũ: {currentInvoice.chiSoNuocCu || 0}</span>
                                                        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Mới: {currentInvoice.chiSoNuocMoi || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right font-medium text-slate-500">
                                                    <p>{(currentInvoice.chiSoNuocMoi || 0) - (currentInvoice.chiSoNuocCu || 0)} m³</p>
                                                    <p className="text-[10px]">x {currentInvoice.giaNuoc?.toLocaleString("vi-VN") || 0}đ</p>
                                                </td>
                                                <td className="px-6 py-5 text-right font-black text-slate-800">{currentInvoice.tienNuoc?.toLocaleString("vi-VN") || 0}đ</td>
                                            </tr>
                                            {/* Other Services */}
                                            <tr className="bg-slate-50/50">
                                                <td className="px-6 py-5">
                                                    <p className="font-bold text-slate-700">Dịch vụ khác</p>
                                                    <p className="text-[10px] text-slate-400">Rác, vệ sinh, internet...</p>
                                                </td>
                                                <td className="px-6 py-5 text-right font-medium text-slate-500">-</td>
                                                <td className="px-6 py-5 text-right font-black text-slate-800">{currentInvoice.tienDichVu?.toLocaleString("vi-VN")}đ</td>
                                            </tr>
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-blue-600 text-white">
                                                <td className="px-6 py-6 font-black text-lg uppercase tracking-widest">Tổng cộng</td>
                                                <td colSpan={2} className="px-6 py-6 text-right font-black text-3xl">
                                                    {currentInvoice.tongTien.toLocaleString("vi-VN")}<span className="text-sm ml-1 opacity-70 italic font-medium">vnđ</span>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* MÃ QR THANH TOÁN SEPAY */}
                            {currentInvoice.trangThai === "Chua_Thanh_Toan" && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 sm:p-8 rounded-[2rem] border border-blue-100 flex flex-col md:flex-row items-center gap-6 sm:gap-8 shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 blur-[2px]">
                                        <QrCode size={120} />
                                    </div>
                                    <div className="bg-white p-3 rounded-3xl shadow-md border border-white/50 relative z-10">
                                        {/* TODO: Thay YOUR_ACCOUNT_NUMBER và YOUR_BANK_NAME bằng thông tin thực tế của bạn (Vd: MB, VCB) */}
                                        <img
                                            src={`https://qr.sepay.vn/img?bank=MB&acc=075767521&amount=${currentInvoice.tongTien}&des=${currentInvoice._id}`}
                                            alt="QR Code Thanh Toán"
                                            className="w-40 h-40 sm:w-48 sm:h-48 object-contain rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-4 text-center md:text-left relative z-10 flex-1">
                                        <div>
                                            <h4 className="text-xl sm:text-2xl font-black text-blue-900 tracking-tight">Thanh toán chuyển khoản</h4>
                                            <p className="text-sm text-blue-600/80 font-medium mt-1">Sử dụng ứng dụng Ngân hàng hoặc MoMo quét mã QR. Hệ thống tự động xác nhận sau 1-3 phút.</p>
                                        </div>

                                        <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl border border-blue-100 shadow-sm inline-flex flex-col items-center md:items-start space-y-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung chuyển khoản (bắt buộc)</span>
                                            <code className="text-lg font-black text-indigo-600 select-all">{currentInvoice._id}</code>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-4 sm:p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="flex-1 bg-slate-900 hover:bg-black text-white font-black py-4 rounded-3xl shadow-xl transition-all active:scale-95"
                            >
                                Đóng hóa đơn
                            </button>
                            <button className="px-10 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-bold py-4 rounded-3xl transition-all shadow-sm active:scale-95 flex items-center gap-2">
                                <Receipt size={18} /> In hóa đơn
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
