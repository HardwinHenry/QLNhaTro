import { useEffect, useState } from "react";
import { Zap, Droplets, Save, History, Loader2, Calculator } from "lucide-react";
import { utilityService, type ChiSoDienNuoc, type GiaDienNuoc } from "../services/utilityService";
import { roomService } from "../services/roomService";
import { useAuthStore } from "../store/authStore";
import { formatVi } from "../utils/dateFormatter";

export default function UtilitiesPage() {
    const { user } = useAuthStore();
    const isAdmin = user?.vaiTro === "Chu_Tro";
    const [chiSos, setChiSos] = useState<ChiSoDienNuoc[]>([]);
    const [latestGia, setLatestGia] = useState<GiaDienNuoc | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"history" | "config">("history");
    const [giaHistory, setGiaHistory] = useState<GiaDienNuoc[]>([]);

    // Price form states
    const [giaDien, setGiaDien] = useState(0);
    const [giaNuoc, setGiaNuoc] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [_, chiSosData, giaData, giaHistoryData] = await Promise.all([
                    roomService.getAllPhongs(),
                    utilityService.getAllChiSos(),
                    utilityService.getLatestGia(),
                    utilityService.getAllGias()
                ]);
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
            setGiaHistory(giaHistoryData);
            setActiveTab("history");
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
                <button
                    onClick={() => setActiveTab("history")}
                    className={`px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "history" ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}
                >
                    <div className="flex items-center gap-2">
                        <History size={16} />
                        Lịch sử chỉ số
                    </div>
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab("config")}
                        className={`px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "config" ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                        <div className="flex items-center gap-2">
                            <Calculator size={16} />
                            Đơn giá & Cấu hình
                        </div>
                    </button>
                )}
            </div>


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
                                        <td className="px-8 py-4 text-slate-400 text-sm">{item.createdAt ? formatVi(item.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "config" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Current Price Display - Left side or atop on mobile */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group h-full">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>

                            <div className="relative z-10 space-y-8">
                                <h2 className="text-2xl font-black flex items-center gap-3 text-blue-400">
                                    <Calculator size={28} />
                                    Đơn giá hiện tại
                                </h2>

                                <div className="space-y-6">
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 group-hover:bg-white/10 transition-colors">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Giá điện</p>
                                        <div className="flex items-end gap-2">
                                            <p className="text-3xl font-black text-amber-500">{latestGia?.giaDien.toLocaleString("vi-VN")}đ</p>
                                            <p className="text-sm font-medium text-slate-400 mb-1">/ kWh</p>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 group-hover:bg-white/10 transition-colors">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Giá nước</p>
                                        <div className="flex items-end gap-2">
                                            <p className="text-3xl font-black text-blue-400">{latestGia?.giaNuoc.toLocaleString("vi-VN")}đ</p>
                                            <p className="text-sm font-medium text-slate-400 mb-1">/ m³</p>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-blue-600/10 rounded-3xl border border-blue-500/20">
                                        <p className="text-sm font-bold text-blue-300 italic flex items-center gap-2">
                                            <Save size={14} />
                                            Cập nhật lần cuối: {latestGia ? formatVi(latestGia.ngayApDung) : "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                        {/* Edit Form */}
                        <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-8">
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
            </div>
        </div>
    )}
        </div>
    );
}
