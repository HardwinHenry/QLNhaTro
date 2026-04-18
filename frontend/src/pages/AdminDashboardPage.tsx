import { useEffect, useState } from "react";
import {
    DoorOpen,
    FileText,
    BarChart3,
    LayoutDashboard,
    Wallet,
    Users,
    X,
    Loader2,
    BellRing,
    Zap,
    Droplets,
    Receipt,
    CheckCircle2,
    Layers,
    Plus,
    Edit3,
    Trash,
    Settings,
    MapPin
} from "lucide-react";
import { dayPhongService, type DayPhong } from "../services/dayPhongService";
import DayPhongFormModal from "../components/DayPhongFormModal";
import Swal from "sweetalert2";
import { vatTuService } from "../services/vatTuService";
import { roomService, type Room } from "../services/roomService";
import { contractService, type Contract } from "../services/contractService";
import { invoiceService, type Invoice } from "../services/invoiceService";
import { utilityService } from "../services/utilityService";
import { cauHinhService, type CauHinh } from "../services/cauHinhService";
import { getAllUsers } from "../services/authService";
import { toast } from "sonner";
import { resolveBackendAssetUrl } from "../utils/url";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        tongPhong: 0,
        phongTrong: 0,
        tongHopDong: 0,
        tongKhach: 0,
        tongDoanhThu: 0
    });
    const [loading, setLoading] = useState(true);

    const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());
    const [revenueStats, setRevenueStats] = useState<{ month: string, revenue: number }[]>([]);
    const [totalRevenueYear, setTotalRevenueYear] = useState(0);

    // Form states (Removed DayPhong/VatTu)

    // Managed Rooms State
    const [managedRooms, setManagedRooms] = useState<(Room & { contract?: Contract, unpaidInvoice?: Invoice })[]>([]);

    // DayPhong Management State
    const [dayPhongs, setDayPhongs] = useState<DayPhong[]>([]);
    const [allRooms, setAllRooms] = useState<Room[]>([]);
    const [isDayPhongModalOpen, setIsDayPhongModalOpen] = useState(false);
    const [editingDayPhong, setEditingDayPhong] = useState<DayPhong | null>(null);

    const [isUtilityModalOpen, setIsUtilityModalOpen] = useState(false);
    const [utilityForm, setUtilityForm] = useState({
        roomName: "",
        roomId: "",
        thang: new Date().toISOString().slice(0, 7),
        dienCu: 0,
        dienMoi: 0,
        nuocCu: 0,
        nuocMoi: 0
    });
    const [cauHinh, setCauHinh] = useState<CauHinh | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [settingsForm, setSettingsForm] = useState({
        nganHang: "",
        soTaiKhoan: "",
        chuTaiKhoan: "",
        diaChi: ""
    });

    const fetchData = async () => {
        try {
            const [dayPhongsData, , rooms, contracts, invoices, users, config] = await Promise.all([
                dayPhongService.getAllDayPhongs(),
                vatTuService.getAllVatTus(),
                roomService.getAllPhongs(),
                contractService.getAllHopDongs(),
                invoiceService.getAllHoaDons(),
                getAllUsers(),
                cauHinhService.getLatestCauHinh()
            ]);

            setDayPhongs(dayPhongsData);
            setAllRooms(rooms);
            if (config) {
                setCauHinh(config);
                setSettingsForm({
                    nganHang: config.nganHang,
                    soTaiKhoan: config.soTaiKhoan,
                    chuTaiKhoan: config.chuTaiKhoan,
                    diaChi: config.diaChi || ""
                });
            }

            // Enrich rented rooms with contracts and invoices
            const rented = rooms.filter(r => r.trangThai === "Da_Thue").map(r => {
                const contract = contracts.find(c => (c.idPhong?._id || c.idPhong) === r._id && c.trangThai === "Con_Hieu_Luc");
                const unpaidInvoice = invoices.find(inv => {
                    const invContractId = inv.idHopDong?._id || inv.idHopDong;
                    return invContractId === contract?._id && inv.trangThai === "Chua_Thanh_Toan";
                });
                return { ...r, contract, unpaidInvoice };
            });
            setManagedRooms(rented);

            setStats({
                tongPhong: rooms.length,
                phongTrong: rooms.filter(r => r.trangThai === "Trong").length,
                tongHopDong: contracts.length,
                tongKhach: Array.isArray(users) ? users.filter((u: any) => u.vaiTro === "Khach").length : 0,
                tongDoanhThu: invoices.reduce((acc, inv) => acc + (inv.trangThai === "Da_Thanh_Toan" ? inv.tongTien : 0), 0)
            });
        } catch (error) {
            toast.error("Lỗi khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchRevenueStats = async () => {
        try {
            const data = await invoiceService.getRevenueStatistics(selectedYear);
            setRevenueStats(data.revenueByMonth);
            setTotalRevenueYear(data.totalRevenue);
        } catch (error) {
            console.error("Failed to fetch revenue stats", error);
        }
    };

    useEffect(() => {
        fetchRevenueStats();
    }, [selectedYear]);

    const handleOpenUtilityModal = async (room: Room) => {
        try {
            const latest = await utilityService.getLatestChiSoByPhong(room._id);
            setUtilityForm({
                ...utilityForm,
                roomId: room._id,
                roomName: room.tenPhong,
                dienCu: latest?.chiSoDienMoi || 0,
                nuocCu: latest?.chiSoNuocMoi || 0,
                dienMoi: latest?.chiSoDienMoi || 0,
                nuocMoi: latest?.chiSoNuocMoi || 0
            });
            setIsUtilityModalOpen(true);
        } catch (error) {
            toast.error("Lỗi khi tải chỉ số cũ");
        }
    };

    const handleSaveUtilities = async () => {
        try {
            await utilityService.createChiSo({
                idPhong: utilityForm.roomId,
                thang: utilityForm.thang,
                chiSoDienCu: utilityForm.dienCu,
                chiSoDienMoi: utilityForm.dienMoi,
                chiSoNuocCu: utilityForm.nuocCu,
                chiSoNuocMoi: utilityForm.nuocMoi
            });
            toast.success("Cập nhật điện nước thành công");
            setIsUtilityModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Lỗi khi cập nhật chỉ số");
        }
    };

    const handleSendReminder = async (invoiceId: string) => {
        try {
            await invoiceService.requestPayment(invoiceId);
            toast.success("Đã gửi nhắc nhở thanh toán");
        } catch (error) {
            toast.error("Lỗi khi gửi nhắc nhở");
        }
    };

    const handleAddDayPhong = () => {
        setEditingDayPhong(null);
        setIsDayPhongModalOpen(true);
    };

    const handleEditDayPhong = (dp: DayPhong) => {
        setEditingDayPhong(dp);
        setIsDayPhongModalOpen(true);
    };

    const handleDeleteDayPhong = async (id: string) => {
        const result = await Swal.fire({
            title: "Xác nhận xóa?",
            text: "Dãy/tầng này sẽ bị xóa vĩnh viễn và có thể ảnh hưởng đến các phòng liên quan!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#e11d48",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Xóa ngay",
            cancelButtonText: "Hủy"
        });

        if (result.isConfirmed) {
            try {
                await dayPhongService.deleteDayPhong(id);
                toast.success("Xóa dãy/tầng thành công");
                fetchData();
            } catch (error) {
                toast.error("Không thể xóa dãy/tầng");
            }
        }
    };

    const handleSaveSettings = async () => {
        try {
            await cauHinhService.updateCauHinh(settingsForm);
            toast.success("Cập nhật cấu hình thành công");
            setIsSettingsModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Không thể lưu cấu hình");
        }
    };

    const statsCards = [
        { label: "Tổng phòng", value: stats.tongPhong.toString(), icon: DoorOpen, color: "text-blue-600", bg: "bg-blue-50", trend: "+2", colorCode: "#2563eb" },
        { label: "Phòng trống", value: stats.phongTrong.toString(), icon: LayoutDashboard, color: "text-emerald-600", bg: "bg-emerald-50", trend: "-1", colorCode: "#059669" },
        { label: "Hợp đồng", value: stats.tongHopDong.toString(), icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50", trend: "+4", colorCode: "#4f46e5" },
        { label: "Khách thuê", value: stats.tongKhach.toString(), icon: Users, color: "text-rose-600", bg: "bg-rose-50", trend: "0", colorCode: "#e11d48" },
        { label: "Doanh thu", value: (stats.tongDoanhThu / 1000000).toFixed(1) + "M", icon: Wallet, color: "text-amber-600", bg: "bg-amber-50", trend: "+12%", colorCode: "#d97706" },
    ];

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-white">
                            <BarChart3 size={24} />
                        </div>
                        Bảng điều khiển
                    </h1>
                    {cauHinh?.diaChi && (
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                            <MapPin size={12} className="text-rose-500" />
                            {cauHinh.diaChi}
                        </p>
                    )}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-2xl text-sm font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Settings size={18} />
                        Cấu hình hệ thống
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                {statsCards.map((stat) => (
                    <div key={stat.label} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
                        <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} opacity-20 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>

                        <div className="flex flex-col gap-6 relative z-10">
                            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center shadow-sm border border-white`}>
                                <stat.icon size={28} className={stat.color} />
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{stat.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                                    {stat.trend && (
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                            {stat.trend}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Statistics Chart */}
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                            <BarChart3 className="text-blue-600" /> Thống kê doanh thu
                        </h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                            Tổng doanh thu năm {selectedYear}: <span className="text-emerald-600 text-sm">{totalRevenueYear.toLocaleString()}đ</span>
                        </p>
                    </div>
                    <div>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-black rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {[...Array(5)].map((_, i) => {
                                const year = new Date().getFullYear() - i;
                                return <option key={year} value={year}>Năm {year}</option>;
                            })}
                        </select>
                    </div>
                </div>

                <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-10 border-b-2 border-slate-100 pb-2 relative">
                    {/* Y-axis guiding lines (decorative) */}
                    <div className="absolute inset-x-0 bottom-1/2 border-b border-dashed border-slate-200 -z-10"></div>
                    <div className="absolute inset-x-0 bottom-full border-b border-dashed border-slate-200 -z-10"></div>

                    {revenueStats.map((stat, i) => {
                        const maxRevenue = Math.max(...revenueStats.map(s => s.revenue), 1);
                        const heightPercent = Math.max((stat.revenue / maxRevenue) * 100, 2); // min 2% for visibility

                        return (
                            <div key={stat.month} className="flex-1 flex flex-col items-center gap-2 group relative">
                                {/* Tooltip */}
                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap z-10 pointer-events-none">
                                    {stat.revenue.toLocaleString()}đ
                                </div>
                                {/* Bar */}
                                <div
                                    className="w-full max-w-[40px] bg-blue-500/80 hover:bg-blue-600 rounded-t-md transition-all duration-500 ease-out cursor-pointer"
                                    style={{ height: `${heightPercent}%` }}
                                ></div>
                                {/* Label */}
                                <span className="text-[10px] font-black text-slate-400 uppercase">T{i + 1}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Rented Rooms Section */}
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Phòng đang thuê</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Quản lý các phòng có khách ở và theo dõi công nợ</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left border-separate border-spacing-y-4">
                        <thead>
                            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-6 py-2">Phòng</th>
                                <th className="px-6 py-2">Khách thuê</th>
                                <th className="px-6 py-2">Chỉ số cũ</th>
                                <th className="px-6 py-2">Thanh toán</th>
                                <th className="px-6 py-2">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {managedRooms.length > 0 ? managedRooms.map((room) => (
                                <tr key={room._id} className="bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 rounded-l-2xl border-y border-l border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                                                <DoorOpen size={18} className="text-blue-600" />
                                            </div>
                                            <span className="font-black text-slate-700">{room.tenPhong}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 border-y border-slate-100">
                                        <span className="text-sm font-bold text-slate-600">{room.contract?.idKhach?.hoVaTen || "N/A"}</span>
                                    </td>
                                    <td className="px-6 py-4 border-y border-slate-100">
                                        <div className="flex flex-col gap-1 text-slate-400 italic">
                                            <span className="text-[10px] font-black flex items-center gap-1 uppercase">--- kWh</span>
                                            <span className="text-[10px] font-black flex items-center gap-1 uppercase">--- m³</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 border-y border-slate-100">
                                        {room.unpaidInvoice ? (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full w-fit border border-amber-100 text-amber-600">
                                                <Receipt size={12} />
                                                <span className="text-xs font-black uppercase">Chưa đóng</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full w-fit border border-emerald-100 text-emerald-600">
                                                <CheckCircle2 size={12} />
                                                <span className="text-xs font-black uppercase">Hoàn tất</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 rounded-r-2xl border-y border-r border-slate-100">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOpenUtilityModal(room)}
                                                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-black hover:text-white transition-all shadow-sm group-hover:border-black"
                                                title="Cập nhật điện nước"
                                            >
                                                <Zap size={14} />
                                            </button>
                                            {room.unpaidInvoice && (
                                                <button
                                                    onClick={() => handleSendReminder(room.unpaidInvoice!._id)}
                                                    className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                    title="Nhắc nhở thanh toán"
                                                >
                                                    <BellRing size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-slate-400 italic">Hiện không có phòng nào đang thuê</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DayPhong Management Section */}
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Quản lý dãy & tầng</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Thêm, sửa, xóa và quản lý hình ảnh khu vực</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleAddDayPhong}
                            className="flex items-center justify-center gap-2 bg-slate-900 px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-black transition-all shadow-lg w-full sm:w-auto"
                        >
                            <Plus size={18} />
                            Thêm dãy/tầng
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dayPhongs.length > 0 ? dayPhongs.map(dp => (
                        <div key={dp._id} className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 group hover:shadow-xl transition-all">
                            <div className="h-40 bg-slate-200 relative">
                                {/* @ts-ignore */}
                                {dp.hinhAnh ? (
                                    /* @ts-ignore */
                                    <img src={resolveBackendAssetUrl(dp.hinhAnh)} alt={dp.viTri} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Layers size={40} />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-slate-900 shadow-sm">
                                    Tầng {dp.tang} - Dãy {dp.soDay}
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-black text-slate-800 truncate">{dp.viTri}</h3>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                                        <DoorOpen size={10} />
                                        <span className="text-[10px] font-black">
                                            {allRooms.filter(r => (r.idDayPhong?._id || r.idDayPhong) === dp._id).length}
                                            {dp.soPhongToiDa > 0 && ` / ${dp.soPhongToiDa}`} phòng
                                        </span>
                                    </div>
                                </div>

                                {dp.soPhongToiDa > 0 && (
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full mb-4 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${(allRooms.filter(r => (r.idDayPhong?._id || r.idDayPhong) === dp._id).length / dp.soPhongToiDa) >= 1 ? "bg-rose-500" : "bg-blue-600"
                                                }`}
                                            style={{ width: `${Math.min(100, (allRooms.filter(r => (r.idDayPhong?._id || r.idDayPhong) === dp._id).length / dp.soPhongToiDa) * 100)}%` }}
                                        ></div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditDayPhong(dp)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                    >
                                        <Edit3 size={14} /> Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDeleteDayPhong(dp._id)}
                                        className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-12 text-center text-slate-400 italic bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            Chưa có dãy/tầng nào được tạo
                        </div>
                    )}
                </div>
            </div>

            {/* Modals removed for DayPhong and VatTu */}

            {/* Utility Update Modal */}
            {
                isUtilityModalOpen && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] p-5 sm:p-8 w-full max-w-lg shadow-2xl relative">
                            <button onClick={() => setIsUtilityModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full"><X size={20} /></button>
                            <div className="mb-6">
                                <h3 className="text-2xl font-black">Cập nhật chỉ số - {utilityForm.roomName}</h3>
                                <p className="text-sm text-slate-400 font-bold">Tháng {utilityForm.thang}</p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                        <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
                                            <Zap size={14} /> Điện (kWh)
                                        </h4>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Số cũ: {utilityForm.dienCu}</label>
                                            <input
                                                type="number"
                                                className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={utilityForm.dienMoi}
                                                onChange={e => setUtilityForm({ ...utilityForm, dienMoi: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                        <h4 className="text-xs font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                                            <Droplets size={14} /> Nước (m³)
                                        </h4>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Số cũ: {utilityForm.nuocCu}</label>
                                            <input
                                                type="number"
                                                className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                                value={utilityForm.nuocMoi}
                                                onChange={e => setUtilityForm({ ...utilityForm, nuocMoi: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => setIsUtilityModalOpen(false)}
                                        className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all font-sans"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleSaveUtilities}
                                        className="flex-[2] px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl font-sans"
                                    >
                                        Lưu chỉ số
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <DayPhongFormModal
                isOpen={isDayPhongModalOpen}
                onClose={() => setIsDayPhongModalOpen(false)}
                onSuccess={fetchData}
                editingDayPhong={editingDayPhong}
            />

            {/* System Settings Modal */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 w-full max-w-2xl shadow-2xl relative my-8">
                        <button onClick={() => setIsSettingsModalOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24} /></button>
                        <div className="mb-8">
                            <h3 className="text-3xl font-black text-slate-900">Cấu hình hệ thống</h3>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Thiết lập thanh toán và vị trí nhà trọ</p>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Wallet size={16} /> Thông tin thanh toán
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Ngân hàng (Viết tắt: MB, VCB...)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                                            placeholder="Ví dụ: MB"
                                            value={settingsForm.nganHang}
                                            onChange={e => setSettingsForm({ ...settingsForm, nganHang: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Số tài khoản</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                                            placeholder="Nhập số tài khoản"
                                            value={settingsForm.soTaiKhoan}
                                            onChange={e => setSettingsForm({ ...settingsForm, soTaiKhoan: e.target.value })}
                                        />
                                    </div>
                                    <div className="sm:col-span-2 space-y-2">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Chủ tài khoản (Không dấu)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                                            placeholder="Ví dụ: NGUYEN VAN A"
                                            value={settingsForm.chuTaiKhoan}
                                            onChange={e => setSettingsForm({ ...settingsForm, chuTaiKhoan: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-black text-rose-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <MapPin size={16} /> Vị trí nhà trọ
                                </h4>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Địa chỉ hiển thị</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold"
                                            placeholder="Số nhà, tên đường, quận/huyện..."
                                            value={settingsForm.diaChi}
                                            onChange={e => setSettingsForm({ ...settingsForm, diaChi: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                <button
                                    onClick={() => setIsSettingsModalOpen(false)}
                                    className="flex-1 px-8 py-4 border-2 border-slate-100 text-slate-400 font-black rounded-2xl hover:bg-slate-50 transition-all font-sans uppercase tracking-widest text-xs"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    className="flex-[2] px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl font-sans uppercase tracking-widest text-xs"
                                >
                                    Lưu cấu hình
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
