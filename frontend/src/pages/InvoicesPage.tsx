import { useEffect, useState } from "react";
import { Receipt, Search, Loader2, CheckCircle2, Clock, Plus, X, Send, Calculator, Trash2, Edit2 } from "lucide-react";
import { invoiceService, type Invoice } from "../services/invoiceService";
import { contractService, type Contract } from "../services/contractService";
import { utilityService } from "../services/utilityService";
import { useAuthStore } from "../store/authStore";

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
            console.error("Lá»—i khi táº£i hÃ³a Ä‘Æ¡n:", error);
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
            alert("Táº¡o hÃ³a Ä‘Æ¡n thÃ nh cÃ´ng");
            setIsCreateModalOpen(false);
            fetchInvoices();
        } catch (error) {
            alert("Lá»—i khi táº¡o hÃ³a Ä‘Æ¡n");
        }
    };

    const handleRequestPayment = async (id: string) => {
        try {
            const res = await invoiceService.requestPayment(id);
            alert(res.message);
        } catch (error) {
            alert("Lá»—i khi gá»­i yÃªu cáº§u");
        }
    };

    const handleDeleteInvoice = async (id: string) => {
        if (!window.confirm("Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a hÃ³a Ä‘Æ¡n nÃ y? HÃ nh Ä‘á»™ng nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c.")) return;

        setIsDeleting(id);
        try {
            await invoiceService.deleteHoaDon(id);
            alert("XÃ³a hÃ³a Ä‘Æ¡n thÃ nh cÃ´ng");
            fetchInvoices();
        } catch (error) {
            alert("Lá»—i khi xÃ³a hÃ³a Ä‘Æ¡n");
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
            alert("Cáº­p nháº­t hÃ³a Ä‘Æ¡n thÃ nh cÃ´ng");
            setIsEditModalOpen(false);
            fetchInvoices();
        } catch (error) {
            alert("Lá»—i khi cáº­p nháº­t hÃ³a Ä‘Æ¡n");
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
        return status === "Da_Thanh_Toan" ? "ÄÃ£ thanh toÃ¡n" : "ChÆ°a thanh toÃ¡n";
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Äang táº£i danh sÃ¡ch hÃ³a Ä‘Æ¡n...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">HÃ³a Ä‘Æ¡n</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Quáº£n lÃ½ cÃ¡c khoáº£n thanh toÃ¡n cá»§a báº¡n</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {isAdmin && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-black transition-all shadow-lg shadow-slate-200"
                        >
                            <Plus size={18} />
                            Táº¡o hÃ³a Ä‘Æ¡n
                        </button>
                    )}
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="TÃ¬m kiáº¿m hÃ³a Ä‘Æ¡n..."
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
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">HÃ³a Ä‘Æ¡n</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">PhÃ²ng</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Thá»i gian</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Tá»•ng tiá»n</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Tráº¡ng thÃ¡i</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Thao tÃ¡c</th>
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
                                                    <p className="text-[10px] text-slate-400 font-medium">Táº¡o ngÃ y: {new Date(invoice.createdAt).toLocaleDateString("vi-VN")}</p>
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
                                            <p className="text-sm font-black text-blue-600">{invoice.tongTien.toLocaleString("vi-VN")}Ä‘</p>
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
                                                    Chi tiáº¿t
                                                </button>
                                                {isAdmin && (
                                                    <div className="flex items-center gap-1">
                                                        {invoice.trangThai === "Chua_Thanh_Toan" && (
                                                            <button
                                                                onClick={() => handleRequestPayment(invoice._id)}
                                                                className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg text-xs font-black hover:bg-amber-100 transition-all border border-amber-200"
                                                                title="Gá»­i yÃªu cáº§u thanh toÃ¡n"
                                                            >
                                                                <Send size={12} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleOpenEdit(invoice)}
                                                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="Sá»­a"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteInvoice(invoice._id)}
                                                            disabled={isDeleting === invoice._id}
                                                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="XÃ³a"
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
                                            <p className="text-slate-400 font-medium">Báº¡n chÆ°a cÃ³ hÃ³a Ä‘Æ¡n nÃ o.</p>
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
                                Táº¡o hÃ³a Ä‘Æ¡n má»›i
                            </h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateInvoice} className="p-4 sm:p-8 space-y-5 sm:space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Há»£p Ä‘á»“ng / PhÃ²ng</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={selectedContract}
                                        onChange={(e) => handleContractChange(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Chá»n há»£p Ä‘á»“ng --</option>
                                        {contracts.map(c => (
                                            <option key={c._id} value={c._id}>{c.idPhong?.tenPhong} - {c.idKhach?.hoVaTen}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">NgÃ y láº­p</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={ngayThangNam}
                                        onChange={(e) => setNgayThangNam(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tiá»n phÃ²ng (vnÄ‘)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none"
                                        value={tienPhong}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Chá»‰ sá»‘ Ä‘iá»‡n (má»›i nháº¥t)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={chiSoDien}
                                        onChange={(e) => setChiSoDien(Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Chá»‰ sá»‘ nÆ°á»›c (má»›i nháº¥t)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={chiSoNuoc}
                                        onChange={(e) => setChiSoNuoc(Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phá»¥ phÃ­ / Dá»‹ch vá»¥</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={tienDichVu}
                                        onChange={(e) => setTienDichVu(Number(e.target.value))}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tá»•ng tiá»n</label>
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
                                Táº¡o vÃ  LÆ°u hÃ³a Ä‘Æ¡n
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
                                Chá»‰nh sá»­a hÃ³a Ä‘Æ¡n
                            </h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateInvoice} className="p-4 sm:p-8 space-y-5 sm:space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Há»£p Ä‘á»“ng / PhÃ²ng</label>
                                    <input
                                        className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none text-slate-500 cursor-not-allowed"
                                        value={`${currentInvoice?.idHopDong?.idPhong?.tenPhong} - ${currentInvoice?.idHopDong?.idKhach?.hoVaTen}`}
                                        disabled
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">NgÃ y láº­p</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={ngayThangNam}
                                        onChange={(e) => setNgayThangNam(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tiá»n phÃ²ng (vnÄ‘)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none text-slate-500 cursor-not-allowed"
                                        value={tienPhong}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Chá»‰ sá»‘ Ä‘iá»‡n (má»›i nháº¥t)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={chiSoDien}
                                        onChange={(e) => setChiSoDien(Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Chá»‰ sá»‘ nÆ°á»›c (má»›i nháº¥t)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={chiSoNuoc}
                                        onChange={(e) => setChiSoNuoc(Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phá»¥ phÃ­ / Dá»‹ch vá»¥</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={tienDichVu}
                                        onChange={(e) => setTienDichVu(Number(e.target.value))}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tá»•ng tiá»n</label>
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
                                Cáº­p nháº­t hÃ³a Ä‘Æ¡n
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
                                    <h2 className="text-2xl font-black tracking-tight">Chi tiáº¿t hÃ³a Ä‘Æ¡n</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">MÃ£ HÄ: #INV-{currentInvoice._id.slice(-8).toUpperCase()}</p>
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
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Thá»i gian láº­p</p>
                                    <p className="text-lg font-bold">ThÃ¡ng {new Date(currentInvoice.ngayThangNam).getMonth() + 1}, {new Date(currentInvoice.ngayThangNam).getFullYear()}</p>
                                    <p className="text-xs text-slate-500">NgÆ°á»i láº­p: Quáº£n trá»‹ viÃªn</p>
                                </div>
                                <div className="text-right space-y-2">
                                    <span className={`inline-flex items-center gap-2 px-6 py-2 rounded-2xl text-xs font-black border shadow-sm ${getStatusStyle(currentInvoice.trangThai)}`}>
                                        {currentInvoice.trangThai === "Da_Thanh_Toan" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                        {getStatusLabel(currentInvoice.trangThai).toUpperCase()}
                                    </span>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">NgÃ y táº¡o: {new Date(currentInvoice.createdAt).toLocaleString("vi-VN")}</p>
                                </div>
                            </div>

                            {/* Tenant and Room Details */}
                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row gap-10">
                                <div className="flex-1 space-y-4 border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-10">
                                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">ThÃ´ng tin khÃ¡ch thuÃª</h4>
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
                                    <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-4">Vá»‹ trÃ­ phÃ²ng</h4>
                                    <div className="space-y-1">
                                        <p className="text-xl font-black text-slate-800">{currentInvoice.idHopDong?.idPhong?.tenPhong}</p>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">DÃ£y {currentInvoice.idHopDong?.idPhong?.idDayPhong?.soDay} - {currentInvoice.idHopDong?.idPhong?.idDayPhong?.viTri}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Billing Table */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                    <Calculator className="text-blue-600" size={18} />
                                    Báº£ng kÃª chi tiáº¿t
                                </h3>
                                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                                    <table className="w-full min-w-[720px] text-left">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Má»¥c chi phÃ­</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Chi tiáº¿t sá»­ dá»¥ng</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">ThÃ nh tiá»n</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {/* Room Rent */}
                                            <tr className="group">
                                                <td className="px-6 py-5">
                                                    <p className="font-bold text-slate-700">Tiá»n phÃ²ng</p>
                                                    <p className="text-[10px] text-slate-400">GiÃ¡ cá»‘ Ä‘á»‹nh hÃ ng thÃ¡ng</p>
                                                </td>
                                                <td className="px-6 py-5 text-right font-medium text-slate-500">1 thÃ¡ng</td>
                                                <td className="px-6 py-5 text-right font-black text-slate-800">{currentInvoice.tienPhong?.toLocaleString("vi-VN")}Ä‘</td>
                                            </tr>
                                            {/* Electricity */}
                                            <tr>
                                                <td className="px-6 py-5 text-slate-700">
                                                    <p className="font-bold">Tiá»n Ä‘iá»‡n</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">CÅ©: {currentInvoice.chiSoDienCu || 0}</span>
                                                        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Má»›i: {currentInvoice.chiSoDienMoi || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right font-medium text-slate-500">
                                                    <p>{(currentInvoice.chiSoDienMoi || 0) - (currentInvoice.chiSoDienCu || 0)} kWh</p>
                                                    <p className="text-[10px]">x {currentInvoice.giaDien?.toLocaleString("vi-VN") || 0}Ä‘</p>
                                                </td>
                                                <td className="px-6 py-5 text-right font-black text-slate-800">{currentInvoice.tienDien?.toLocaleString("vi-VN") || 0}Ä‘</td>
                                            </tr>
                                            {/* Water */}
                                            <tr>
                                                <td className="px-6 py-5 text-slate-700">
                                                    <p className="font-bold">Tiá»n nÆ°á»›c</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">CÅ©: {currentInvoice.chiSoNuocCu || 0}</span>
                                                        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Má»›i: {currentInvoice.chiSoNuocMoi || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right font-medium text-slate-500">
                                                    <p>{(currentInvoice.chiSoNuocMoi || 0) - (currentInvoice.chiSoNuocCu || 0)} mÂ³</p>
                                                    <p className="text-[10px]">x {currentInvoice.giaNuoc?.toLocaleString("vi-VN") || 0}Ä‘</p>
                                                </td>
                                                <td className="px-6 py-5 text-right font-black text-slate-800">{currentInvoice.tienNuoc?.toLocaleString("vi-VN") || 0}Ä‘</td>
                                            </tr>
                                            {/* Other Services */}
                                            <tr className="bg-slate-50/50">
                                                <td className="px-6 py-5">
                                                    <p className="font-bold text-slate-700">Dá»‹ch vá»¥ khÃ¡c</p>
                                                    <p className="text-[10px] text-slate-400">RÃ¡c, vá»‡ sinh, internet...</p>
                                                </td>
                                                <td className="px-6 py-5 text-right font-medium text-slate-500">-</td>
                                                <td className="px-6 py-5 text-right font-black text-slate-800">{currentInvoice.tienDichVu?.toLocaleString("vi-VN")}Ä‘</td>
                                            </tr>
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-blue-600 text-white">
                                                <td className="px-6 py-6 font-black text-lg uppercase tracking-widest">Tá»•ng cá»™ng</td>
                                                <td colSpan={2} className="px-6 py-6 text-right font-black text-3xl">
                                                    {currentInvoice.tongTien.toLocaleString("vi-VN")}<span className="text-sm ml-1 opacity-70 italic font-medium">vnÄ‘</span>
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
                                ÄÃ³ng hÃ³a Ä‘Æ¡n
                            </button>
                            <button className="px-10 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-bold py-4 rounded-3xl transition-all shadow-sm active:scale-95 flex items-center gap-2">
                                <Receipt size={18} /> In hÃ³a Ä‘Æ¡n
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



