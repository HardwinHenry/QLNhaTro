import { useEffect, useState } from "react";
import { LayoutGrid, Loader2, Building2, MapPin, ExternalLink } from "lucide-react";
import { roomService } from "../services/roomService";
import type { Room } from "../services/roomService";
import { cauHinhService, type CauHinh } from "../services/cauHinhService";
import { toast } from "sonner";
import { useSearchParams } from "react-router";
import { dayPhongService, type DayPhong } from "../services/dayPhongService";
import FloorPlanMap from "../components/FloorPlanMap";


export default function HomePage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [dayPhongs, setDayPhongs] = useState<DayPhong[]>([]);
    const [cauHinh, setCauHinh] = useState<CauHinh | null>(null);
    const [loading, setLoading] = useState(true);

    const [searchParams] = useSearchParams();
    const highlightRoomId = searchParams.get("roomId");

    const fetchHomeData = async () => {
        setLoading(true);
        try {
            const [roomsData, dayPhongsData, configData] = await Promise.all([
                roomService.getAllPhongs(),
                dayPhongService.getAllDayPhongs(),
                cauHinhService.getLatestCauHinh()
            ]);
            setRooms(roomsData);
            setDayPhongs(dayPhongsData);
            setCauHinh(configData);
        } catch (error) {
            console.error("Lỗi khi tải thông tin:", error);
            toast.error("Không thể tải thông tin trang chủ");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchHomeData();
    }, []);


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Đang tải trang chủ...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 sm:space-y-16 pb-12">
            {/* Hero Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-6 sm:p-8 lg:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-xl shadow-slate-100 border border-slate-100 relative overflow-hidden group">
                <div className="relative z-10 space-y-4">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                        Chào mừng bạn <br />
                        đến với <span className="text-blue-600">QL Nhà Trọ</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-base sm:text-lg max-w-lg leading-relaxed">
                        Hệ thống quản lý phòng trọ hiện đại, chuyên nghiệp và dễ sử dụng nhất.
                        Nâng cao trải nghiệm sống và quản lý của bạn.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-4">
                        <div className="flex items-center gap-3 bg-blue-50 px-4 sm:px-6 py-3 rounded-2xl border border-blue-100 shadow-sm">
                            <LayoutGrid size={20} className="text-blue-600 sm:w-6 sm:h-6" />
                            <span className="text-base sm:text-lg font-black text-slate-800">{rooms.length} Phòng Hiện Có</span>
                        </div>

                        <button
                            onClick={() => {
                                if (cauHinh?.diaChi) {
                                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cauHinh.diaChi)}`, '_blank');
                                } else {
                                    toast.warning("Địa chỉ nhà trọ chưa được cấu hình");
                                }
                            }}
                            className="flex items-center gap-3 bg-rose-50 px-4 sm:px-6 py-3 rounded-2xl border border-rose-100 text-rose-600 hover:bg-rose-100 transition-all font-black shadow-sm group/btn"
                        >
                            <MapPin size={20} className="group-hover/btn:scale-110 transition-transform" />
                            <span>Xem bản đồ</span>
                            <ExternalLink size={14} className="opacity-50" />
                        </button>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -mr-48 -mt-48 group-hover:bg-blue-500/10 transition-colors duration-1000"></div>
                <div className="absolute bottom-0 right-12 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors duration-1000"></div>
            </div>

            {/* Floor Plan Map */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                        <Building2 size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-800">Sơ đồ mặt bằng nhà trọ</h2>
                        <p className="text-slate-500 font-medium mt-1">Bấm vào phòng để xem chi tiết</p>
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100">
                    <FloorPlanMap rooms={rooms} dayPhongs={dayPhongs} highlightRoomId={highlightRoomId} />
                </div>

            </div>
        </div>
    );
}
