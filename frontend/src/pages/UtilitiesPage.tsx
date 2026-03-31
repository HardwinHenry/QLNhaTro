import { useEffect, useState } from "react";
import { Zap, Droplets, Save, History, Plus, Loader2, Calculator, LayoutTemplate } from "lucide-react";
import { utilityService, type ChiSoDienNuoc, type GiaDienNuoc } from "../services/utilityService";
import { roomService, type Room } from "../services/roomService";
import { useAuthStore } from "../store/authStore";
import { formatVi } from "../utils/dateFormatter";

export default function UtilitiesPage() {
    const { user } = useAuthStore();
    const isAdmin = user?.vaiTro === "Chu_Tro";
    const [rooms, setRooms] = useState<Room[]>([]);
    const [chiSos, setChiSos] = useState<ChiSoDienNuoc[]>([]);
    const [latestGia, setLatestGia] = useState<GiaDienNuoc | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"record" | "history" | "config">(isAdmin ? "record" : "history");
    const [giaHistory, setGiaHistory] = useState<GiaDienNuoc[]>([]);

    // Form states
    const [selectedRoom, setSelectedRoom] = useState("");
    const [roomSearchTerm, setRoomSearchTerm] = useState("");
    const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
    const [thang, setThang] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
    const [dienCu, setDienCu] = useState(0);
    const [dienMoi, setDienMoi] = useState(0);
    const [nuocCu, setNuocCu] = useState(0);
    const [nuocMoi, setNuocMoi] = useState(0);

    // Price form states
    const [giaDien, setGiaDien] = useState(0);
    const [giaNuoc, setGiaNuoc] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [roomsData, chiSosData, giaData, giaHistoryData] = await Promise.all([
                    roomService.getAllPhongs(),
                    utilityService.getAllChiSos(),
                    utilityService.getLatestGia(),
                    utilityService.getAllGias()
                ]);
                setRooms(roomsData);
                setChiSos(chiSosData);
                setGiaHistory(giaHistoryData);
                if (giaData) {
                    setLatestGia(giaData);
                    setGiaDien(giaData.giaDien);
                    setGiaNuoc(giaData.giaNuoc);
                }
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleRoomChange = async (idPhong: string) => {
        setSelectedRoom(idPhong);
        try {
            const latest = await utilityService.getLatestChiSoByPhong(idPhong);
            if (latest) {
                setDienCu(latest.chiSoDienMoi);
                setNuocCu(latest.chiSoNuocMoi);
                setDienMoi(latest.chiSoDienMoi);
                setNuocMoi(latest.chiSoNuocMoi);
            } else {
                setDienCu(0);
                setNuocCu(0);
                setDienMoi(0);
                setNuocMoi(0);
            }
            // Clear search when a room is explicitly unselected by deleting
            if(!idPhong) setRoomSearchTerm("");

        } catch (error) {
            console.error("Lỗi khi tải chỉ số cũ:", error);
        }
    };

    const handleSaveChiSo = async () => {
        if (!selectedRoom) return alert("Vui lòng chọn phòng");

        if (dienMoi < dienCu) {
            return alert("Chỉ số điện mới không được nhỏ hơn chỉ số cũ");
        }
        if (nuocMoi < nuocCu) {
            return alert("Chỉ số nước mới không được nhỏ hơn chỉ số cũ");
        }

        try {
            await utilityService.createChiSo({
                idPhong: selectedRoom,
                thang,
                chiSoDienCu: dienCu,
                chiSoDienMoi: dienMoi,
                chiSoNuocCu: nuocCu,
                chiSoNuocMoi: nuocMoi
            });
            alert("Lưu chỉ số thành công");
            // Refresh history
            const chiSosData = await utilityService.getAllChiSos();
            setChiSos(chiSosData);
            setActiveTab("history");
        } catch (error) {
            alert("Lỗi khi lưu chỉ số: " + (error as any).response?.data?.message || "Lỗi không xác định");
        }
    };

    const handleUpdateGia = async () => {
        try {
            await utilityService.updateGia({
                ngayApDung: new Date().toISOString(),
                giaDien,
                giaNuoc
            });
            alert("Cập nhật giá thành công");
            const [giaData, giaHistoryData] = await Promise.all([
                utilityService.getLatestGia(),
                utilityService.getAllGias()
            ]);
            setLatestGia(giaData);
            setGiaHistory(giaHistoryData);
            setActiveTab("record");
        } catch (error) {
            alert("Lỗi khi cập nhật giá");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Đang tải dữ liệu điện nước...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Điện & Nước</h1>
                <p className="text-slate-500 mt-1 font-medium italic">Quản lý chỉ số hàng tháng và đơn giá</p>
            </div>

            <div className="flex flex-wrap bg-white p-1 rounded-2xl border border-slate-200 w-full sm:w-fit shadow-sm gap-1">
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab("record")}
                        className={`px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "record" ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                        <div className="flex items-center gap-2">
                            <Plus size={16} />
                            Ghi chỉ số
                        </div>
                    </button>
                )}
                <button
                    onClick={() => setActiveTab("history")}
                    className={`px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "history" ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}
                >
                    <div className="flex items-center gap-2">
                        <History size={16} />
                        Lịch sử
                    </div>
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab("config")}
                        className={`px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "config" ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                        <div className="flex items-center gap-2">
                            <Calculator size={16} />
                            Cấu hình giá
                        </div>
                    </button>
                )}
            </div>

            {activeTab === "record" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Plus className="text-blue-600" size={20} />
                            Nhập chỉ số mới
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Chọn phòng</label>
                                <div className="relative">
                                    <div className="relative">
                                        <LayoutTemplate className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="Nhập số phòng..."
                                            value={roomSearchTerm}
                                            onChange={(e) => {
                                                setRoomSearchTerm(e.target.value);
                                                setIsRoomDropdownOpen(true);
                                                if (!e.target.value) setSelectedRoom("");
                                            }}
                                            onFocus={() => setIsRoomDropdownOpen(true)}
                                            required={!selectedRoom}
                                        />
                                    </div>

                                    {isRoomDropdownOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                            {rooms.filter(r =>
                                                r.trangThai === "Da_Thue" && r.tenPhong.toLowerCase().includes(roomSearchTerm.toLowerCase())
                                            ).length > 0 ? (
                                                rooms.filter(r =>
                                                    r.trangThai === "Da_Thue" && r.tenPhong.toLowerCase().includes(roomSearchTerm.toLowerCase())
                                                ).map(room => (
                                                    <button
                                                        key={room._id}
                                                        type="button"
                                                        className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex flex-col gap-0.5 transition-colors border-b border-slate-50 last:border-0"
                                                        onClick={() => {
                                                            handleRoomChange(room._id);
                                                            setRoomSearchTerm(room.tenPhong);
                                                            setIsRoomDropdownOpen(false);
                                                        }}
                                                    >
                                                        <span className="font-bold text-slate-800">{room.tenPhong}</span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-3 text-sm text-slate-400 italic">Không tìm thấy phòng...</div>
                                            )}
                                        </div>
                                    )}
                                    {/* Hidden required field to ensure form validation */}
                                    <input type="hidden" value={selectedRoom} required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ngày / Tháng / Năm</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={thang}
                                    onChange={(e) => setThang(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2">
                                        <Zap size={16} /> Điện (kWh)
                                    </h3>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 italic">Chỉ số cũ</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                            value={dienCu}
                                            onChange={(e) => setDienCu(Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 italic text-blue-600">Chỉ số mới</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={dienMoi}
                                            onChange={(e) => setDienMoi(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                    <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                                        <Droplets size={16} /> Nước (m³)
                                    </h3>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 italic">Chỉ số cũ</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                            value={nuocCu}
                                            onChange={(e) => setNuocCu(Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 italic text-emerald-600">Chỉ số mới</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                            value={nuocMoi}
                                            onChange={(e) => setNuocMoi(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveChiSo}
                                className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                <Save size={18} />
                                Lưu chỉ số
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-5 sm:p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>

                        <div className="relative z-10">
                            <h2 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 flex items-center gap-2 text-blue-400">
                                <Calculator size={24} />
                                Đơn giá hiện tại
                            </h2>

                            <div className="space-y-6 sm:space-y-8">
                                <div className="flex items-center justify-between p-4 sm:p-6 bg-white/5 rounded-3xl border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center">
                                            <Zap size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Giá điện</p>
                                            <p className="text-2xl font-black">{latestGia?.giaDien.toLocaleString("vi-VN")}đ <span className="text-sm font-normal text-slate-400">/ kWh</span></p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 sm:p-6 bg-white/5 rounded-3xl border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center">
                                            <Droplets size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Giá nước</p>
                                            <p className="text-2xl font-black">{latestGia?.giaNuoc.toLocaleString("vi-VN")}đ <span className="text-sm font-normal text-slate-400">/ m³</span></p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-blue-600/10 rounded-3xl border border-blue-500/20">
                                    <p className="text-sm font-medium text-blue-300 italic flex items-center gap-2">
                                        <Save size={14} />
                                        Áp dụng từ: {latestGia ? formatVi(latestGia.ngayApDung) : "N/A"}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setActiveTab("config")}
                                className="w-full mt-8 sm:mt-10 py-3.5 sm:py-4 bg-white text-slate-900 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all shadow-xl shadow-black/20"
                            >
                                Thay đổi đơn giá
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "history" && (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Phòng</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Kỳ (Ngày/Tháng/Năm)</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-blue-600">Điện (Số mới)</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-emerald-600">Nước (Số mới)</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Ngày ghi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {chiSos.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-4 font-black text-slate-800">{item.idPhong?.tenPhong || "N/A"}</td>
                                        <td className="px-8 py-4 text-slate-600 font-bold">{item.thang.includes("-") && item.thang.split("-").length === 3 ? formatVi(item.thang) : item.thang}</td>
                                        <td className="px-8 py-4 text-blue-600 font-bold">{item.chiSoDienMoi} kWh</td>
                                        <td className="px-8 py-4 text-emerald-600 font-bold">{item.chiSoNuocMoi} m³</td>
                                        <td className="px-8 py-4 text-slate-400 text-sm">{item.createdAt ? formatVi(item.createdAt) : "N/A"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "config" && (
                <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 shadow-xl space-y-6 sm:space-y-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-slate-900">Thiết lập đơn giá</h2>
                        <p className="text-slate-500 font-medium mt-2 italic">Giá này sẽ được tự động áp dụng khi tính hóa đơn</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Zap size={14} className="text-amber-500" /> Đơn giá điện (vnđ / kWh)
                            </label>
                            <input
                                type="number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-lg font-black focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 outline-none transition-all"
                                value={giaDien}
                                onChange={(e) => setGiaDien(Number(e.target.value))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Droplets size={14} className="text-blue-500" /> Đơn giá nước (vnđ / m³)
                            </label>
                            <input
                                type="number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-lg font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                value={giaNuoc}
                                onChange={(e) => setGiaNuoc(Number(e.target.value))}
                            />
                        </div>

                        <button
                            onClick={handleUpdateGia}
                            className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-3xl shadow-2xl transition-all shadow-black/20 flex items-center justify-center gap-2 mt-4"
                        >
                            <Save size={18} />
                            Cập nhật đơn giá mới
                        </button>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mt-8">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <History size={20} className="text-blue-600" />
                                Lịch sử thay đổi đơn giá
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/30">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-slate-400">Ngày áp dụng</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-slate-400">Giá điện (vnđ)</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-slate-400">Giá nước (vnđ)</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right text-slate-400">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {giaHistory.map((item, index) => (
                                        <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-bold text-slate-700">{formatVi(item.ngayApDung)}</p>
                                                <p className="text-[10px] text-slate-400">{formatVi(item.ngayApDung, { hour: '2-digit', minute: '2-digit' })}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-amber-600 font-black text-sm">{item.giaDien.toLocaleString("vi-VN")}đ</span>
                                                <span className="text-[10px] text-slate-400 ml-1 italic">/kWh</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-blue-600 font-black text-sm">{item.giaNuoc.toLocaleString("vi-VN")}đ</span>
                                                <span className="text-[10px] text-slate-400 ml-1 italic">/m³</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                {index === 0 ? (
                                                    <span className="inline-flex items-center px-4 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200">ĐANG ÁP DỤNG</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-4 py-1 bg-slate-100 text-slate-400 text-[10px] font-black rounded-full border border-slate-200">HẾT HẠN</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
