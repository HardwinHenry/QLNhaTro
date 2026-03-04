import { useEffect, useState } from "react";
import { Zap, Droplets, Save, History, Plus, Loader2, Calculator } from "lucide-react";
import { utilityService, type ChiSoDienNuoc, type GiaDienNuoc } from "../services/utilityService";
import { roomService, type Room } from "../services/roomService";
import { useAuthStore } from "../store/authStore";

export default function UtilitiesPage() {
    const { user } = useAuthStore();
    const isAdmin = user?.vaiTro === "Chu_Tro";
    const [rooms, setRooms] = useState<Room[]>([]);
    const [chiSos, setChiSos] = useState<ChiSoDienNuoc[]>([]);
    const [latestGia, setLatestGia] = useState<GiaDienNuoc | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"record" | "history" | "config">(isAdmin ? "record" : "history");

    // Form states
    const [selectedRoom, setSelectedRoom] = useState("");
    const [thang, setThang] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
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
                const [roomsData, chiSosData, giaData] = await Promise.all([
                    roomService.getAllPhongs(),
                    utilityService.getAllChiSos(),
                    utilityService.getLatestGia()
                ]);
                setRooms(roomsData);
                setChiSos(chiSosData);
                if (giaData) {
                    setLatestGia(giaData);
                    setGiaDien(giaData.giaDien);
                    setGiaNuoc(giaData.giaNuoc);
                }
            } catch (error) {
                console.error("Lá»—i khi táº£i dá»¯ liá»‡u:", error);
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
        } catch (error) {
            console.error("Lá»—i khi táº£i chá»‰ sá»‘ cÅ©:", error);
        }
    };

    const handleSaveChiSo = async () => {
        if (!selectedRoom) return alert("Vui lÃ²ng chá»n phÃ²ng");
        try {
            await utilityService.createChiSo({
                idPhong: selectedRoom,
                thang,
                chiSoDienCu: dienCu,
                chiSoDienMoi: dienMoi,
                chiSoNuocCu: nuocCu,
                chiSoNuocMoi: nuocMoi
            });
            alert("LÆ°u chá»‰ sá»‘ thÃ nh cÃ´ng");
            // Refresh history
            const chiSosData = await utilityService.getAllChiSos();
            setChiSos(chiSosData);
            setActiveTab("history");
        } catch (error) {
            alert("Lá»—i khi lÆ°u chá»‰ sá»‘: " + (error as any).response?.data?.message || "Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh");
        }
    };

    const handleUpdateGia = async () => {
        try {
            await utilityService.updateGia({
                ngayApDung: new Date().toISOString(),
                giaDien,
                giaNuoc
            });
            alert("Cáº­p nháº­t giÃ¡ thÃ nh cÃ´ng");
            const giaData = await utilityService.getLatestGia();
            setLatestGia(giaData);
            setActiveTab("record");
        } catch (error) {
            alert("Lá»—i khi cáº­p nháº­t giÃ¡");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Äang táº£i dá»¯ liá»‡u Ä‘iá»‡n nÆ°á»›c...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Äiá»‡n & NÆ°á»›c</h1>
                <p className="text-slate-500 mt-1 font-medium italic">Quáº£n lÃ½ chá»‰ sá»‘ hÃ ng thÃ¡ng vÃ  Ä‘Æ¡n giÃ¡</p>
            </div>

            <div className="flex flex-wrap bg-white p-1 rounded-2xl border border-slate-200 w-full sm:w-fit shadow-sm gap-1">
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab("record")}
                        className={`px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "record" ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                        <div className="flex items-center gap-2">
                            <Plus size={16} />
                            Ghi chá»‰ sá»‘
                        </div>
                    </button>
                )}
                <button
                    onClick={() => setActiveTab("history")}
                    className={`px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "history" ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}
                >
                    <div className="flex items-center gap-2">
                        <History size={16} />
                        Lá»‹ch sá»­
                    </div>
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab("config")}
                        className={`px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "config" ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                        <div className="flex items-center gap-2">
                            <Calculator size={16} />
                            Cáº¥u hÃ¬nh giÃ¡
                        </div>
                    </button>
                )}
            </div>

            {activeTab === "record" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Plus className="text-blue-600" size={20} />
                            Nháº­p chá»‰ sá»‘ má»›i
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Chá»n phÃ²ng</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={selectedRoom}
                                    onChange={(e) => handleRoomChange(e.target.value)}
                                >
                                    <option value="">-- Chá»n phÃ²ng --</option>
                                    {rooms.map(room => (
                                        <option key={room._id} value={room._id}>{room.tenPhong}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ThÃ¡ng / NÄƒm</label>
                                <input
                                    type="month"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={thang}
                                    onChange={(e) => setThang(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2">
                                        <Zap size={16} /> Äiá»‡n (kWh)
                                    </h3>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 italic">Chá»‰ sá»‘ cÅ©</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                            value={dienCu}
                                            onChange={(e) => setDienCu(Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 italic text-blue-600">Chá»‰ sá»‘ má»›i</label>
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
                                        <Droplets size={16} /> NÆ°á»›c (mÂ³)
                                    </h3>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 italic">Chá»‰ sá»‘ cÅ©</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                            value={nuocCu}
                                            onChange={(e) => setNuocCu(Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 italic text-emerald-600">Chá»‰ sá»‘ má»›i</label>
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
                                LÆ°u chá»‰ sá»‘
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-5 sm:p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>

                        <div className="relative z-10">
                            <h2 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 flex items-center gap-2 text-blue-400">
                                <Calculator size={24} />
                                ÄÆ¡n giÃ¡ hiá»‡n táº¡i
                            </h2>

                            <div className="space-y-6 sm:space-y-8">
                                <div className="flex items-center justify-between p-4 sm:p-6 bg-white/5 rounded-3xl border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center">
                                            <Zap size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">GiÃ¡ Ä‘iá»‡n</p>
                                            <p className="text-2xl font-black">{latestGia?.giaDien.toLocaleString("vi-VN")}Ä‘ <span className="text-sm font-normal text-slate-400">/ kWh</span></p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 sm:p-6 bg-white/5 rounded-3xl border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center">
                                            <Droplets size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">GiÃ¡ nÆ°á»›c</p>
                                            <p className="text-2xl font-black">{latestGia?.giaNuoc.toLocaleString("vi-VN")}Ä‘ <span className="text-sm font-normal text-slate-400">/ mÂ³</span></p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-blue-600/10 rounded-3xl border border-blue-500/20">
                                    <p className="text-sm font-medium text-blue-300 italic flex items-center gap-2">
                                        <Save size={14} />
                                        Ãp dá»¥ng tá»«: {latestGia ? new Date(latestGia.ngayApDung).toLocaleDateString("vi-VN") : "N/A"}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setActiveTab("config")}
                                className="w-full mt-8 sm:mt-10 py-3.5 sm:py-4 bg-white text-slate-900 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all shadow-xl shadow-black/20"
                            >
                                Thay Ä‘á»•i Ä‘Æ¡n giÃ¡
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
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">PhÃ²ng</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">ThÃ¡ng</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-blue-600">Äiá»‡n (Sá»‘ má»›i)</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-emerald-600">NÆ°á»›c (Sá»‘ má»›i)</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">NgÃ y ghi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {chiSos.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-4 font-black text-slate-800">{item.idPhong?.tenPhong || "N/A"}</td>
                                        <td className="px-8 py-4 text-slate-600">{item.thang}</td>
                                        <td className="px-8 py-4 text-blue-600 font-bold">{item.chiSoDienMoi} kWh</td>
                                        <td className="px-8 py-4 text-emerald-600 font-bold">{item.chiSoNuocMoi} mÂ³</td>
                                        <td className="px-8 py-4 text-slate-400 text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "N/A"}</td>
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
                        <h2 className="text-2xl font-black text-slate-900">Thiáº¿t láº­p Ä‘Æ¡n giÃ¡</h2>
                        <p className="text-slate-500 font-medium mt-2 italic">GiÃ¡ nÃ y sáº½ Ä‘Æ°á»£c tá»± Ä‘á»™ng Ã¡p dá»¥ng khi tÃ­nh hÃ³a Ä‘Æ¡n</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Zap size={14} className="text-amber-500" /> ÄÆ¡n giÃ¡ Ä‘iá»‡n (vnÄ‘ / kWh)
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
                                <Droplets size={14} className="text-blue-500" /> ÄÆ¡n giÃ¡ nÆ°á»›c (vnÄ‘ / mÂ³)
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
                            Cáº­p nháº­t Ä‘Æ¡n giÃ¡ má»›i
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


