import { useEffect, useState } from "react";
import { Filter, Search, RotateCcw } from "lucide-react";
import RoomCard from "../components/RoomCard";
import { roomService } from "../services/roomService";
import type { Room } from "../services/roomService";
import { useAuthStore } from "../store/authStore";
import { dayPhongService, type DayPhong } from "../services/dayPhongService";
import { toast } from "sonner";
import Swal from "sweetalert2";
import RoomFormModal from "../components/RoomFormModal";
import { resolveBackendAssetUrl } from "../utils/url";

export default function RentedRoomsPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [dayPhongs, setDayPhongs] = useState<DayPhong[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        search: "",
        loaiPhong: "",
        idDayPhong: "",
        minPrice: "",
        maxPrice: "",
        trangThai: "Da_Thue"
    });

    const { user } = useAuthStore();
    const isAdmin = user?.vaiTro === "Chu_Tro";

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== "")
            );

            const [data, dayPhongsData] = await Promise.all([
                roomService.getAllPhongs(activeFilters),
                dayPhongService.getAllDayPhongs()
            ]);
            setRooms(data);
            setDayPhongs(dayPhongsData);
        } catch (error) {
            console.error("Lỗi khi tải danh sách phòng đã thuê:", error);
            toast.error("Không thể tải danh sách phòng đã thuê");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchRooms();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters]);

    const handleEditRoom = (id: string) => {
        const room = rooms.find(r => r._id === id);
        if (room) {
            setEditingRoom(room);
            setIsModalOpen(true);
        }
    };

    const handleDeleteRoom = async (id: string) => {
        const result = await Swal.fire({
            title: "Bạn có chắc chắn?",
            text: "Phòng này sẽ bị xóa vĩnh viễn!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#2563eb",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Xóa ngay",
            cancelButtonText: "Hủy"
        });

        if (result.isConfirmed) {
            try {
                await roomService.deletePhong(id);
                toast.success("Xóa phòng thành công");
                fetchRooms();
            } catch (error) {
                toast.error("Lỗi khi xóa phòng");
            }
        }
    };

    const getDisplayRoom = (room: Room, index: number) => {
        const getLocalImages = (idx: number) => {
            const imgIndexes = [
                ((idx * 3) % 18) + 1,
                ((idx * 3 + 1) % 18) + 1,
                ((idx * 3 + 2) % 18) + 1
            ];
            return imgIndexes.map(i => {
                const num = i === 9 ? "9" : i.toString().padStart(2, '0');
                return `/Phong${num}.jpg`;
            });
        };

        return {
            id: room._id,
            name: room.tenPhong,
            price: room.giaPhong,
            status: room.trangThai === "Trong" ? ("available" as const) : ("occupied" as const),
            images: (Array.isArray(room.hinhAnh) && room.hinhAnh.length > 0)
                ? room.hinhAnh.map(img => img.startsWith('/uploads') ? resolveBackendAssetUrl(img) : img)
                : (typeof room.hinhAnh === 'string' && room.hinhAnh)
                    ? [room.hinhAnh.startsWith('/uploads') ? resolveBackendAssetUrl(room.hinhAnh) : room.hinhAnh, ...getLocalImages(index).slice(1)]
                    : getLocalImages(index),
            area: room.dienTich,
            capacity: room.sucChua,
            loaiPhong: room.loaiPhong,
            dayPhong: room.idDayPhong ? `Dãy ${room.idDayPhong.soDay}` : undefined,
            vatTu: room.vatTu,
            khachThue: room.khachThue
        };
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col items-center justify-center gap-8 sm:gap-10 bg-white p-6 sm:p-8 lg:p-12 rounded-[2rem] sm:rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-100/50 transition-all duration-500">
                <div className="flex flex-col items-center text-center space-y-4 w-full">
                    <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Quản lý <span className="text-rose-600">phòng đã thuê</span>
                    </h1>
                    <p className="text-slate-500 font-semibold italic text-base sm:text-lg leading-relaxed max-w-md">
                        Theo dõi danh sách khách bao gồm thông tin chi tiết các phòng đã có người ở
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-5 w-full">
                    <div className="relative group w-full md:w-[350px]">
                        <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm phòng..."
                            className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 bg-slate-50/50 border-2 border-slate-100 rounded-3xl text-slate-800 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-rose-500/5 focus:border-rose-500 focus:bg-white transition-all text-base sm:text-lg shadow-sm"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex-1 md:flex-initial flex items-center justify-center gap-3 px-5 sm:px-8 py-3 sm:py-4 rounded-3xl font-black transition-all shadow-lg active:scale-95 text-base sm:text-lg ${showFilters ? "bg-rose-600 text-white shadow-rose-200" : "bg-white text-slate-600 border-2 border-slate-100 shadow-slate-50 hover:bg-slate-50"}`}
                    >
                        <Filter size={20} />
                        <span>Bộ lọc</span>
                    </button>
                </div>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
                <div className="bg-white p-5 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50 space-y-6 sm:space-y-10 animate-in slide-in-from-top-4 fade-in duration-500 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-2 h-full bg-rose-600"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Loại phòng</label>
                            <select
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-600 transition-all appearance-none"
                                value={filters.loaiPhong}
                                onChange={(e) => setFilters({ ...filters, loaiPhong: e.target.value })}
                            >
                                <option value="">Tất cả loại</option>
                                <option value="Phong_Lon">Phòng lớn</option>
                                <option value="Phong_Thuong">Phòng thường</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Dãy / Tầng</label>
                            <select
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-600 transition-all appearance-none"
                                value={filters.idDayPhong}
                                onChange={(e) => setFilters({ ...filters, idDayPhong: e.target.value })}
                            >
                                <option value="">Tất cả dãy</option>
                                {dayPhongs.map(day => (
                                    <option key={day._id} value={day._id}>Dãy {day.soDay} - {day.viTri}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ search: "", loaiPhong: "", idDayPhong: "", minPrice: "", maxPrice: "", trangThai: "Da_Thue" })}
                                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-rose-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
                            >
                                <RotateCcw size={18} />
                                LÀM MỚI BỘ LỌC
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Room Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32">
                    <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-slate-500 font-black text-lg animate-pulse tracking-tight">Đang tải danh sách phòng đã thuê...</p>
                </div>
            ) : rooms.length > 0 ? (
                <div className="space-y-12">
                    {Object.entries(
                        rooms.reduce((acc: any, room) => {
                            const tang = room.idDayPhong?.tang ?? "Khác";
                            const day = room.idDayPhong?.soDay ?? "Khác";
                            if (!acc[day]) acc[day] = {};
                            if (!acc[day][tang]) acc[day][tang] = [];
                            acc[day][tang].push(room);
                            return acc;
                        }, {})
                    ).sort(([dayA], [dayB]) => {
                        if (dayA === "Khác") return 1;
                        if (dayB === "Khác") return -1;
                        return dayA.localeCompare(dayB);
                    }).map(([day, tangs]: [string, any]) => (
                        <div key={day} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                                    {day === "Khác" ? "Khu vực khác" : `Dãy ${day}`}
                                </h2>
                                <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-200 to-transparent rounded-full"></div>
                            </div>
                            
                            <div className="space-y-10 pl-0 sm:pl-4 border-l-0 sm:border-l-[3px] border-slate-100">
                                {Object.entries(tangs).sort(([tangA], [tangB]) => {
                                    if (tangA === "Khác") return 1;
                                    if (tangB === "Khác") return -1;
                                    return Number(tangA) - Number(tangB);
                                }).map(([tang, tangRooms]: [string, any]) => (
                                    <div key={tang} className="space-y-5">
                                        <div className="flex items-center">
                                            <h3 className="text-lg font-bold text-rose-600 bg-rose-50/80 py-2 px-5 rounded-xl inline-flex items-center gap-3 border border-rose-100/50 shadow-sm">
                                                {tang === "Khác" ? "Tầng khác" : `Tầng ${tang}`}
                                                <span className="text-xs font-black bg-white text-slate-600 px-2.5 py-1 rounded-lg shadow-sm border border-slate-100">
                                                    {tangRooms.length} phòng đã thuê
                                                </span>
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                                            {tangRooms.map((room: Room) => {
                                                const originalIndex = rooms.findIndex((r) => r._id === room._id);
                                                return (
                                                    <RoomCard
                                                        key={room._id}
                                                        room={getDisplayRoom(room, originalIndex)}
                                                        isAdmin={isAdmin}
                                                        onEdit={handleEditRoom}
                                                        onDelete={handleDeleteRoom}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-16 sm:py-24 text-center bg-white border border-dashed border-slate-300 rounded-[2rem] sm:rounded-[3rem] shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <Search size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Chưa có phòng nào được thuê</h3>
                    <p className="text-slate-400 font-medium max-w-xs mx-auto">Danh sách này sẽ hiển thị các phòng sau khi được ký hợp đồng.</p>
                </div>
            )}

            <RoomFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchRooms}
                editingRoom={editingRoom}
            />
        </div>
    );
}
