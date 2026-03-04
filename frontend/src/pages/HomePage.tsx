import { useEffect, useState } from "react";
import { LayoutGrid, Loader2 } from "lucide-react";
import { roomService } from "../services/roomService";
import type { Room } from "../services/roomService";
import { toast } from "sonner";

export default function HomePage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const data = await roomService.getAllPhongs();
            setRooms(data);
        } catch (error) {
            console.error("Lỗi khi tải thông tin:", error);
            toast.error("Không thể tải thông tin trang chủ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
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
        <div className="space-y-12">
            {/* Hero Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-12 rounded-[3rem] shadow-xl shadow-slate-100 border border-slate-100 relative overflow-hidden group">
                <div className="relative z-10 space-y-4">
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                        Chào mừng bạn <br />
                        đến với <span className="text-blue-600">QL Nhà Trọ</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg max-w-lg leading-relaxed">
                        Hệ thống quản lý phòng trọ hiện đại, chuyên nghiệp và dễ sử dụng nhất.
                        Nâng cao trải nghiệm sống và quản lý của bạn.
                    </p>
                    <div className="pt-4 flex items-center gap-6">
                        <div className="flex items-center gap-3 bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100">
                            <LayoutGrid size={24} className="text-blue-600" />
                            <span className="text-lg font-black text-slate-800">{rooms.length} Phòng Hiện Có</span>
                        </div>
                    </div>
                </div>

                {/* Visual Decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -mr-48 -mt-48 group-hover:bg-blue-500/10 transition-colors duration-1000"></div>
                <div className="absolute bottom-0 right-12 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors duration-1000"></div>
            </div>

            {/* Boarding House Layout Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Sơ đồ tổng thể</h2>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                <div className="bg-white p-4 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 rounded-[2.5rem] p-10 relative group border border-slate-100">
                        <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                            <img
                                src="http://localhost:5001/SoDo.png"
                                alt="Sơ đồ nhà trọ"
                                className="w-full h-auto object-contain max-h-[600px] group-hover:scale-105 transition-transform duration-1000"
                            />
                        </div>
                        <div className="mt-8 text-center relative z-10">
                            <p className="text-slate-500 font-medium italic">Sử dụng mục <strong>"Xem Phòng"</strong> ở menu bên trái để quản lý và xem chi tiết từng phòng.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
