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
    const INVOICE_POLLING_MS = 15000;
    const { user } = useAuthStore();
    const isAdmin = user?.vaiTro === "Chu_Tro";
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "Chua_Thanh_Toan" | "Da_Thanh_Toan">("all");
    const [viewMode, setViewMode] = useState<"list" | "room">("list");

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
            console.error("Lá»—i khi táº£i hÃ³a Ä‘Æ¡n:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
        const pollTimer = window.setInterval(() => {
            fetchInvoices();
        }, INVOICE_POLLING_MS);

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

        return () => {
            window.clearInterval(pollTimer);
        };
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
                utilityService.getLatestGia(),

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

        // Validation: Only allow current month
        const today = new Date();
        const firstDayOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const inputDate = new Date(ngayThangNam);
        const firstDayOfInputMonth = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1);

        if (firstDayOfInputMonth.getTime() !== firstDayOfThisMonth.getTime()) {
            Swal.fire({
                icon: 'error',
                title: 'NgÃ y khÃ´ng há»£p lá»‡',
                text: 'Chá»‰ cÃ³ thá»ƒ táº¡o hÃ³a Ä‘Æ¡n cho thÃ¡ng hiá»‡n táº¡i.',
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
                title: isSameMonth ? 'HÃ³a Ä‘Æ¡n Ä‘Ã£ tá»“n táº¡i' : 'Thá»© tá»± khÃ´ng há»£p lá»‡',
                text: isSameMonth
                    ? 'ÄÃ£ cÃ³ hÃ³a Ä‘Æ¡n cho thÃ¡ng nÃ y cho há»£p Ä‘á»“ng nÃ y.'
                    : 'KhÃ´ng thá»ƒ táº¡o hÃ³a Ä‘Æ¡n cho thÃ¡ng cÅ© khi Ä‘Ã£ cÃ³ hÃ³a Ä‘Æ¡n má»›i hÆ¡n cho há»£p Ä‘á»“ng nÃ y.',
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
                    title: 'NgÃ y khÃ´ng há»£p lá»‡',
                    text: `NgÃ y láº­p pháº£i náº±m trong thá»i háº¡n há»£p Ä‘á»“ng (${formatVi(startDate)}${endDate ? ` - ${formatVi(endDate)}` : ""})`,
                    confirmButtonColor: '#2563eb'
                });
                return;
            }
        }

        // Validation: Indices (Strictly New > Old)
        if (chiSoDien <= chiSoDienCu) {
            Swal.fire({
                icon: 'error',
                title: 'Chá»‰ sá»‘ khÃ´ng há»£p lá»‡',
                text: 'Chá»‰ sá»‘ Ä‘iá»‡n má»›i pháº£i Lá»šN HÆ N chá»‰ sá»‘ cÅ© (Äiá»u kiá»‡n báº¯t buá»™c).',
                confirmButtonColor: '#2563eb'
            });
            return;
        }
        if (chiSoNuoc <= chiSoNuocCu) {
            Swal.fire({
                icon: 'error',
                title: 'Chá»‰ sá»‘ khÃ´ng há»£p lá»‡',
                text: 'Chá»‰ sá»‘ nÆ°á»›c má»›i pháº£i Lá»šN HÆ N chá»‰ sá»‘ cÅ© (Äiá»u kiá»‡n báº¯t buá»™c).',
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
            Swal.fire({ icon: 'success', title: 'ThÃ nh cÃ´ng!', text: 'Táº¡o hÃ³a Ä‘Æ¡n thÃ nh cÃ´ng', confirmButtonColor: '#2563eb' });
            setIsCreateModalOpen(false);
            fetchInvoices();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Tháº¥t báº¡i!', text: 'Lá»—i khi táº¡o hÃ³a Ä‘Æ¡n', confirmButtonColor: '#2563eb' });
        }
    };


    const handleDeleteInvoice = async (id: string) => {
        const result = await Swal.fire({
            title: 'Báº¡n cÃ³ cháº¯c cháº¯n?',
            text: 'Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a hÃ³a Ä‘Æ¡n nÃ y? HÃ nh Ä‘á»™ng nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Äá»“ng Ã½ xÃ³a',
            cancelButtonText: 'Há»§y'
        });

        if (!result.isConfirmed) return;

        setIsDeleting(id);
        try {
            await invoiceService.deleteHoaDon(id);
            Swal.fire({ icon: 'success', title: 'ÄÃ£ xÃ³a!', text: 'XÃ³a hÃ³a Ä‘Æ¡n thÃ nh cÃ´ng', confirmButtonColor: '#2563eb' });
            fetchInvoices();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Tháº¥t báº¡i!', text: 'Lá»—i khi xÃ³a hÃ³a Ä‘Æ¡n', confirmButtonColor: '#2563eb' });
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
        setTienDichVu(invoice.tienDichVu || 0);
        setTongTien(invoice.tongTien);
        setIsEditModalOpen(true);
    };

    const handleUpdateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentInvoice) return;

        // Validation: Only allow current month
        const today = new Date();
        const firstDayOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const inputDate = new Date(ngayThangNam);
        const firstDayOfInputMonth = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1);

        if (firstDayOfInputMonth.getTime() !== firstDayOfThisMonth.getTime()) {
            Swal.fire({
                icon: 'error',
                title: 'NgÃ y khÃ´ng há»£p lá»‡',
                text: 'Chá»‰ cÃ³ thá»ƒ Ä‘iá»u chá»‰nh hÃ³a Ä‘Æ¡n trong thÃ¡ng hiá»‡n táº¡i.',
                confirmButtonColor: '#2563eb'
            });
            return;
        }

        // Validation: Indices (Strictly New > Old)
        if (chiSoDien <= chiSoDienCu) {
            Swal.fire({ icon: 'error', title: 'Lá»—i!', text: 'Sá»‘ Ä‘iá»‡n má»›i pháº£i lá»›n hÆ¡n sá»‘ cÅ©', confirmButtonColor: '#2563eb' });
            return;
        }
        if (chiSoNuoc <= chiSoNuocCu) {
            Swal.fire({ icon: 'error', title: 'Lá»—i!', text: 'Sá»‘ nÆ°á»›c má»›i pháº£i lá»›n hÆ¡n sá»‘ cÅ©', confirmButtonColor: '#2563eb' });
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
            Swal.fire({ icon: 'success', title: 'ThÃ nh cÃ´ng!', text: 'Cáº­p nháº­t hÃ³a Ä‘Æ¡n thÃ nh cÃ´ng', confirmButtonColor: '#2563eb' });
            setIsEditModalOpen(false);
            fetchInvoices();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Tháº¥t báº¡i!', text: 'Lá»—i khi cáº­p nháº­t hÃ³a Ä‘Æ¡n', confirmButtonColor: '#2563eb' });
        }
    };





    const handlePayment = (invoice: Invoice) => {
        const amount = Math.max(0, Math.round(invoice.tongTien || 0));
        const monthYear = formatVi(invoice.ngayThangNam, { month: "2-digit", year: "numeric" });
        const paymentCode = `HD:${invoice._id}`;
        const roomName = invoice.idHopDong?.idPhong?.tenPhong || "NA";
        const description = `${paymentCode} thanh toan phong ${roomName} thang ${monthYear}`;
        const accountName = cauHinh?.chuTaiKhoan || "TRAN TRUONG DANG KHOA";
        const bankCode = cauHinh?.nganHang || "MB";
        const accountNo = cauHinh?.soTaiKhoan || "0987706342";
        const sepayQrUrl =
            `https://qr.sepay.vn/img?acc=${encodeURIComponent(accountNo)}` +
            `&bank=${encodeURIComponent(bankCode)}` +
            `&amount=${amount}` +
            `&des=${encodeURIComponent(description)}`;

        Swal.fire({
            title: "Thanh toan chuyen khoan (SePay)",
            html: `
                <div class="flex flex-col items-center space-y-4">
                    <p class="text-sm text-slate-500">Mo app ngan hang va quet ma QR SePay ben duoi de chuyen khoan.</p>
                    <div class="p-4 bg-white border-2 border-slate-100 rounded-3xl shadow-lg inline-block">
                        <img src="${sepayQrUrl}" alt="SePay QR" class="w-64 h-auto rounded-xl block mx-auto" />
                    </div>
                    <div class="text-left w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-2 space-y-2">
                        <div class="flex justify-between items-center"><span class="text-xs font-bold text-slate-400">Ngan hang:</span> <span class="text-sm font-black text-slate-800">${bankCode}</span></div>
                        <div class="flex justify-between items-center"><span class="text-xs font-bold text-slate-400">Chu tai khoan:</span> <span class="text-sm font-black text-slate-800">${accountName}</span></div>
                        <div class="flex justify-between items-center"><span class="text-xs font-bold text-slate-400">So tai khoan:</span> <span class="text-sm font-black text-slate-800">${accountNo}</span></div>
                        <div class="flex justify-between items-center"><span class="text-xs font-bold text-slate-400">So tien:</span> <span class="text-sm font-black text-blue-600">${amount.toLocaleString('vi-VN')}d</span></div>
                        <div class="flex justify-between items-center"><span class="text-xs font-bold text-slate-400">Noi dung:</span> <span class="text-xs font-black text-slate-800 truncate ml-4" title="${description}">${description}</span></div>
                        <div class="flex justify-between items-center"><span class="text-xs font-bold text-slate-400">Ma doi soat:</span> <span class="text-xs font-black text-emerald-700">${paymentCode}</span></div>
                    </div>
                    <p class="text-xs text-emerald-600 font-bold text-center mt-2">He thong tu dong doi soat qua SePay webhook va cap nhat hoa don sau khi nhan giao dich hop le.</p>
                    <p class="text-xs text-red-500 font-bold text-center">Luu y: Chuyen dung so tien va dung noi dung de he thong tu xac nhan.</p>
                </div>
            `,
            showCloseButton: true,
            showConfirmButton: false,
            width: "28rem",
            customClass: {
                popup: "rounded-[2.5rem] p-4 sm:p-6"
            }
        });
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
            Swal.fire({ icon: 'success', title: 'ThÃ nh cÃ´ng!', text: 'LÆ°u cáº¥u hÃ¬nh thanh toÃ¡n thÃ nh cÃ´ng', confirmButtonColor: '#2563eb' });
            setIsSettingsModalOpen(false);
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Tháº¥t báº¡i!', text: 'Lá»—i khi lÆ°u cáº¥u hÃ¬nh', confirmButtonColor: '#2563eb' });
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch =
            inv.idHopDong?.idPhong?.tenPhong?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.idHopDong?.idKhach?.hoVaTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv._id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || inv.trangThai === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const groupedInvoices = filteredInvoices.reduce((acc, inv) => {
        const roomName = inv.idHopDong?.idPhong?.tenPhong || "KhÃ¡c";
        if (!acc[roomName]) acc[roomName] = [];
        acc[roomName].push(inv);
        return acc;
    }, {} as Record<string, Invoice[]>);

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
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="flex items-center justify-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <Settings size={18} />
                                Thiáº¿t láº­p
                            </button>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-black transition-all shadow-lg shadow-slate-200"
                            >
                                <Plus size={18} />
                                Táº¡o hÃ³a Ä‘Æ¡n
                            </button>
                        </div>
                    )}
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="TÃ¬m kiáº¿m hÃ³a Ä‘Æ¡n..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-full sm:w-64 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                    {[
                        { id: "all", label: "Táº¥t cáº£" },
                        { id: "Chua_Thanh_Toan", label: "ChÆ°a thanh toÃ¡n" },
                        { id: "Da_Thanh_Toan", label: "Lá»‹ch sá»­ / ÄÃ£ thanh toÃ¡n" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterStatus(tab.id as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filterStatus === tab.id
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
                    <button
                        onClick={() => setViewMode("list")}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === "list"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        Danh sÃ¡ch
                    </button>
                    <button
                        onClick={() => setViewMode("room")}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === "room"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        Theo phÃ²ng
                    </button>
                </div>
            </div>

            {viewMode === "list" ? (
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
                                {filteredInvoices.length > 0 ? (
                                    filteredInvoices.map((invoice) => (
                                        <tr key={invoice._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                        <Receipt size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">#INV-{invoice._id.slice(-6).toUpperCase()}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">Táº¡o ngÃ y: {formatVi(invoice.createdAt)}</p>
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
                                                <p className="text-sm font-black text-blue-600">{(invoice.tongTien ?? 0).toLocaleString("vi-VN")}Ä‘</p>
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
                                                    {(!isAdmin && invoice.trangThai === "Chua_Thanh_Toan") && (
                                                        <button
                                                            onClick={() => handlePayment(invoice)}
                                                            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1 rounded-xl text-xs font-black hover:bg-black transition-all shadow-md shadow-blue-100"
                                                        >
                                                            <CreditCard size={12} />
                                                            Thanh toÃ¡n
                                                        </button>
                                                    )}
                                                    {isAdmin && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleOpenEdit(invoice)}
                                                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                                title="Sá»­a"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteInvoice(invoice._id)}
                                                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                title="XÃ³a"
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
                                                <p className="text-slate-400 font-medium">KhÃ´ng tÃ¬m tháº¥y hÃ³a Ä‘Æ¡n phÃ¹ há»£p.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.keys(groupedInvoices).length > 0 ? (
                        Object.entries(groupedInvoices).map(([roomName, roomInvoices]) => (
                            <div key={roomName} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-fit">
                                <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                                            <LayoutTemplate size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 leading-tight">{roomName}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{roomInvoices.length} hÃ³a Ä‘Æ¡n</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-400">Ná»£: </p>
                                        <p className="text-sm font-black text-red-500">
                                            {roomInvoices
                                                .filter(i => i.trangThai === "Chua_Thanh_Toan")
                                                .reduce((sum, i) => sum + (i.tongTien || 0), 0)
                                                .toLocaleString("vi-VN")}Ä‘
                                        </p>
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {roomInvoices
                                        .sort((a, b) => new Date(b.ngayThangNam).getTime() - new Date(a.ngayThangNam).getTime())
                                        .map((invoice) => (
                                            <div key={invoice._id} className="p-4 hover:bg-slate-50 transition-all group flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`w-2 h-2 rounded-full ${invoice.trangThai === "Da_Thanh_Toan" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                                                        <p className="text-xs font-black text-slate-700 truncate">
                                                            {formatVi(invoice.ngayThangNam, { month: "2-digit", year: "numeric" })}
                                                        </p>
                                                    </div>
                                                    <p className="text-[10px] font-black text-blue-600">{(invoice.tongTien ?? 0).toLocaleString("vi-VN")}Ä‘</p>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => {
                                                            setCurrentInvoice(invoice);
                                                            setIsDetailsModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                                                        title="Chi tiáº¿t"
                                                    >
                                                        <Search size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                                <div className="p-4 bg-slate-50/30 border-t border-slate-100">
                                    <button
                                        onClick={() => {
                                            // Optional: Room-specific action
                                        }}
                                        className="w-full py-2 text-[10px] font-black text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-200 rounded-xl transition-all uppercase tracking-widest"
                                    >
                                        Xem toÃ n bá»™ lá»‹ch sá»­
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
                            <Receipt size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-medium">KhÃ´ng tÃ¬m tháº¥y phÃ²ng nÃ o.</p>
                        </div>
                    )}
                </div>
            )}

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
                                <div className="sm:col-span-2 relative">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Há»£p Ä‘á»“ng / PhÃ²ng</label>
                                    <div className="relative">
                                        <LayoutTemplate className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                            placeholder="Nháº­p sá»‘ phÃ²ng hoáº·c tÃªn khÃ¡ch..."
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
                                                <div className="px-4 py-3 text-sm text-slate-400 italic">KhÃ´ng tÃ¬m tháº¥y há»£p Ä‘á»“ng...</div>
                                            )}
                                        </div>
                                    )}
                                    <input type="hidden" value={selectedContract} required />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">NgÃ y láº­p</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={ngayThangNam}
                                        onChange={(e) => setNgayThangNam(e.target.value)}
                                        min={new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)}
                                        max={new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)}
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

                                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-200/50">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chá»‰ sá»‘ Ä‘iá»‡n (CÅ©)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed outline-none transition-all"
                                            value={chiSoDienCu}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Chá»‰ sá»‘ Ä‘iá»‡n (Má»›i nháº¥t)</label>
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
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chá»‰ sá»‘ nÆ°á»›c (CÅ©)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed outline-none transition-all"
                                            value={chiSoNuocCu}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Chá»‰ sá»‘ nÆ°á»›c (Má»›i nháº¥t)</label>
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
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">TiÃªu thá»¥ Äiá»‡n</p>
                                        <span className="text-sm font-black text-blue-600">+{Math.max(0, chiSoDien - chiSoDienCu)} kWh</span>
                                    </div>
                                    <div className="text-[10px] text-blue-500 font-bold text-right border-t border-blue-100 pt-1">
                                        {(Math.max(0, chiSoDien - chiSoDienCu) * giaDien).toLocaleString('vi-VN')}vnÄ‘
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col gap-2">
                                    <div className="flex items-center justify-between font-medium">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">TiÃªu thá»¥ NÆ°á»›c</p>
                                        <span className="text-sm font-black text-emerald-600">+{Math.max(0, chiSoNuoc - chiSoNuocCu)} mÂ³</span>
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-bold text-right border-t border-emerald-100 pt-1">
                                        {(Math.max(0, chiSoNuoc - chiSoNuocCu) * giaNuoc).toLocaleString('vi-VN')}vnÄ‘
                                    </div>
                                </div>

                                <div className="sm:col-span-2 p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cáº¥u trÃºc hÃ³a Ä‘Æ¡n</p>
                                        <Calculator size={16} className="text-blue-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm"><span className="text-slate-400">Tiá»n phÃ²ng:</span> <span className="font-bold">{(tienPhong || 0).toLocaleString('vi-VN')}Ä‘</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-400">Tiá»n Ä‘iá»‡n:</span> <span className="font-bold">{(tienDien || 0).toLocaleString('vi-VN')}Ä‘</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-400">Tiá»n nÆ°á»›c:</span> <span className="font-bold">{(tienNuoc || 0).toLocaleString('vi-VN')}Ä‘</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-400">Dá»‹ch vá»¥:</span> <span className="font-bold">{(tienDichVu || 0).toLocaleString('vi-VN')}Ä‘</span></div>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                        <span className="text-xs font-black text-blue-400 uppercase tracking-tighter">Tá»•ng cá»™ng thÃ¡ng nÃ y:</span>
                                        <span className="text-3xl font-black">{tongTien.toLocaleString('vi-VN')}Ä‘</span>
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100 sm:col-span-2">
                                    <h3 className="text-sm font-bold text-purple-700 flex items-center gap-2">
                                        <Plus size={16} /> PhÃ­ dá»‹ch vá»¥ khÃ¡c (vnÄ‘)
                                    </h3>
                                    <input
                                        type="number"
                                        className="w-full bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none transition-all"
                                        placeholder="PhÃ­ vá»‡ sinh, wifi, rÃ¡c..."
                                        value={tienDichVu}
                                        onChange={(e) => setTienDichVu(Number(e.target.value))}
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

                                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-200/50">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chá»‰ sá»‘ Ä‘iá»‡n (CÅ©)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed outline-none transition-all"
                                            value={chiSoDienCu}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Chá»‰ sá»‘ Ä‘iá»‡n (Má»›i nháº¥t)</label>
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
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chá»‰ sá»‘ nÆ°á»›c (CÅ©)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed outline-none transition-all"
                                            value={chiSoNuocCu}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Chá»‰ sá»‘ nÆ°á»›c (Má»›i nháº¥t)</label>
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
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">TiÃªu thá»¥ Äiá»‡n</p>
                                        <span className="text-sm font-black text-blue-600">+{Math.max(0, chiSoDien - chiSoDienCu)} kWh</span>
                                    </div>
                                    <div className="text-[10px] text-blue-500 font-bold text-right border-t border-blue-100 pt-1">
                                        {(Math.max(0, chiSoDien - chiSoDienCu) * giaDien).toLocaleString('vi-VN')}vnÄ‘
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col gap-2">
                                    <div className="flex items-center justify-between font-medium">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">TiÃªu thá»¥ NÆ°á»›c</p>
                                        <span className="text-sm font-black text-emerald-600">+{Math.max(0, chiSoNuoc - chiSoNuocCu)} mÂ³</span>
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-bold text-right border-t border-emerald-100 pt-1">
                                        {(Math.max(0, chiSoNuoc - chiSoNuocCu) * giaNuoc).toLocaleString('vi-VN')}vnÄ‘
                                    </div>
                                </div>

                                <div className="sm:col-span-2 p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cáº¥u trÃºc hÃ³a Ä‘Æ¡n</p>
                                        <Calculator size={16} className="text-blue-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm"><span className="text-slate-400">Tiá»n phÃ²ng:</span> <span className="font-bold">{(tienPhong || 0).toLocaleString('vi-VN')}Ä‘</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-400">Tiá»n Ä‘iá»‡n:</span> <span className="font-bold">{(tienDien || 0).toLocaleString('vi-VN')}Ä‘</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-400">Tiá»n nÆ°á»›c:</span> <span className="font-bold">{(tienNuoc || 0).toLocaleString('vi-VN')}Ä‘</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-400">Dá»‹ch vá»¥:</span> <span className="font-bold">{(tienDichVu || 0).toLocaleString('vi-VN')}Ä‘</span></div>
                                    </div>
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                        <span className="text-xs font-black text-blue-400 uppercase tracking-tighter">Tá»•ng cá»™ng thÃ¡ng nÃ y:</span>
                                        <span className="text-3xl font-black">{tongTien.toLocaleString('vi-VN')}Ä‘</span>
                                    </div>
                                </div>
                                <div className="space-y-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100 sm:col-span-2">
                                    <h3 className="text-sm font-bold text-purple-700 flex items-center gap-2">
                                        <Plus size={16} /> PhÃ­ dá»‹ch vá»¥ khÃ¡c (vnÄ‘)
                                    </h3>
                                    <input
                                        type="number"
                                        className="w-full bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none transition-all"
                                        placeholder="PhÃ­ vá»‡ sinh, wifi, rÃ¡c..."
                                        value={tienDichVu}
                                        onChange={(e) => setTienDichVu(Number(e.target.value))}
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
                    <div className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
                        {/* Header */}
                        <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <Receipt size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight">Chi tiáº¿t hÃ³a Ä‘Æ¡n</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">MÃ£ HÄ: #INV-{currentInvoice!._id.slice(-8).toUpperCase()}</p>
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
                                    <p className="text-lg font-bold">ThÃ¡ng {new Date(currentInvoice!.ngayThangNam).getMonth() + 1}, {new Date(currentInvoice!.ngayThangNam).getFullYear()}</p>
                                    <p className="text-xs text-slate-500">NgÆ°á»i láº­p: Quáº£n trá»‹ viÃªn</p>
                                </div>
                                <div className="text-right space-y-2">
                                    <span className={`inline-flex items-center gap-2 px-6 py-2 rounded-2xl text-xs font-black border shadow-sm ${getStatusStyle(currentInvoice!.trangThai)}`}>
                                        {currentInvoice!.trangThai === "Da_Thanh_Toan" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                        {getStatusLabel(currentInvoice!.trangThai).toUpperCase()}
                                    </span>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">NgÃ y táº¡o: {formatVi(currentInvoice!.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            {/* Tenant and Room Details */}
                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row gap-10">
                                <div className="flex-1 space-y-4 border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-10">
                                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">ThÃ´ng tin khÃ¡ch thuÃª</h4>
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
                                    <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-4">Vá»‹ trÃ­ phÃ²ng</h4>
                                    <div className="space-y-1">
                                        <p className="text-xl font-black text-slate-800">{currentInvoice!.idHopDong?.idPhong?.tenPhong}</p>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">DÃ£y {currentInvoice!.idHopDong?.idPhong?.idDayPhong?.soDay} - {currentInvoice!.idHopDong?.idPhong?.idDayPhong?.viTri}</p>
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
                                    <table className="w-full min-w-[600px] text-left">
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
                                                <td className="px-6 py-5 text-right font-black text-slate-800">{(currentInvoice!.tienPhong ?? 0).toLocaleString("vi-VN")}Ä‘</td>
                                            </tr>
                                            {/* Electricity */}
                                            <tr>
                                                <td className="px-6 py-5 text-slate-700">
                                                    <p className="font-bold">Tiá»n Ä‘iá»‡n</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">CÅ©: {currentInvoice!.chiSoDienCu || 0}</span>
                                                        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Má»›i: {currentInvoice!.chiSoDienMoi || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right font-medium text-slate-500">
                                                    <p>{(currentInvoice!.chiSoDienMoi || 0) - (currentInvoice!.chiSoDienCu || 0)} kWh</p>
                                                    <p className="text-[10px]">x {currentInvoice!.giaDien?.toLocaleString("vi-VN") || 0}Ä‘</p>
                                                </td>
                                                <td className="px-6 py-5 text-right font-black text-slate-800">{currentInvoice!.tienDien?.toLocaleString("vi-VN") || 0}Ä‘</td>
                                            </tr>
                                            {/* Water */}
                                            <tr>
                                                <td className="px-6 py-5 text-slate-700">
                                                    <p className="font-bold">Tiá»n nÆ°á»›c</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">CÅ©: {currentInvoice!.chiSoNuocCu || 0}</span>
                                                        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Má»›i: {currentInvoice!.chiSoNuocMoi || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right font-medium text-slate-500">
                                                    <p>{(currentInvoice!.chiSoNuocMoi || 0) - (currentInvoice!.chiSoNuocCu || 0)} mÂ³</p>
                                                    <p className="text-[10px]">x {currentInvoice!.giaNuoc?.toLocaleString("vi-VN") || 0}Ä‘</p>
                                                </td>
                                                <td className="px-6 py-5 text-right font-black text-slate-800">{currentInvoice!.tienNuoc?.toLocaleString("vi-VN") || 0}Ä‘</td>
                                            </tr>
                                            {/* Service Fee */}
                                            {currentInvoice!.tienDichVu > 0 && (
                                                <tr className="bg-purple-50/30">
                                                    <td className="px-6 py-5 text-slate-700">
                                                        <p className="font-bold">PhÃ­ dá»‹ch vá»¥ khÃ¡c</p>
                                                        <p className="text-[10px] text-slate-400">Vá»‡ sinh, wifi, rÃ¡c...</p>
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-medium text-slate-500">-</td>
                                                    <td className="px-6 py-5 text-right font-black text-slate-800">{currentInvoice!.tienDichVu.toLocaleString("vi-VN")}Ä‘</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-blue-600 text-white">
                                                <td className="px-6 py-6 font-black text-lg uppercase tracking-widest">Tá»•ng cá»™ng</td>
                                                <td colSpan={2} className="px-6 py-6 text-right font-black text-2xl sm:text-3xl">
                                                    {(currentInvoice!.tongTien ?? 0).toLocaleString("vi-VN")}<span className="text-sm ml-1 opacity-70 italic font-medium">vnÄ‘</span>
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
                            {(!isAdmin && currentInvoice!.trangThai === "Chua_Thanh_Toan") && (
                                <button
                                    onClick={() => handlePayment(currentInvoice!)}
                                    className="px-10 bg-blue-600 text-white font-black py-4 rounded-3xl shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-2 hover:bg-black"
                                >
                                    <CreditCard size={18} /> Thanh toÃ¡n ngay
                                </button>
                            )}
                            <button className="px-10 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-bold py-4 rounded-3xl transition-all shadow-sm active:scale-95 flex items-center gap-2">
                                <Receipt size={18} /> In hÃ³a Ä‘Æ¡n
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
                                Thiáº¿t láº­p Thanh toÃ¡n
                            </h2>
                            <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveSettings} className="p-4 sm:p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">TÃªn mÃ£ ngÃ¢n hÃ ng (Viáº¿t táº¯t)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        placeholder="VÃ­ dá»¥: MB, VCB, TCB..."
                                        value={cfgNganHang}
                                        onChange={(e) => setCfgNganHang(e.target.value)}
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium mt-1">Viáº¿t mÃ£ viáº¿t táº¯t nhÆ° MB, VCB, ICB, ACB, VPB, VPB, TCB, VPB.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Sá»‘ tÃ i khoáº£n</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={cfgSoTaiKhoan}
                                        onChange={(e) => setCfgSoTaiKhoan(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">TÃªn chá»§ tÃ i khoáº£n (KhÃ´ng dáº¥u)</label>
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
                                LÆ°u thiáº¿t láº­p
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

