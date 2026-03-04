import { useEffect, useState } from "react";
import { Plus, Filter, Search, RotateCcw } from "lucide-react";
import RoomCard from "../components/RoomCard";
import { roomService } from "../services/roomService";
import type { Room } from "../services/roomService";
import { useAuthStore } from "../store/authStore";
import { dayPhongService, type DayPhong } from "../services/dayPhongService";
import { toast } from "sonner";
import Swal from "sweetalert2";
import RoomFormModal from "../components/RoomFormModal";
import { resolveBackendAssetUrl } from "../utils/url";

export default function RoomsPage() {
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
        trangThai: ""
    });

    const { user } = useAuthStore();
    const isAdmin = user?.vaiTro === "Chu_Tro";

    const fetchRooms = async () => {
        setLoading(true);
        try {
            // Clean up empty filters
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
            console.error("Lỗi khi tải danh sách phòng:", error);
            toast.error("Không thể tải danh sách phòng");
        } finally {
            setLoading(false);
        }
    };

    // Use effect to fetch when filters change (with small delay for search)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchRooms();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters]);

    const handleAddRoom = () => {
        setEditingRoom(null);
        setIsModalOpen(true);
    };

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
            vatTu: room.vatTu
        };
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col items-center justify-center gap-10 bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-100/50 transition-all duration-500">
                <div className="flex flex-col items-center text-center space-y-4 w-full">
                    <h1 className="text-4xl xl:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Khu vực <span className="text-blue-600">tìm phòng</span>
                    </h1>
                    <p className="text-slate-500 font-semibold italic text-lg leading-relaxed max-w-md">
                        Lọc và tìm không gian sống theo ý muốn của bạn
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-5 w-full">
                    {/* Search Input Group */}
                    <div className="relative group w-full md:w-[350px]">
                        <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Tên phòng, địa chỉ..."
                            className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-3xl text-slate-800 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-lg shadow-sm"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex-1 md:flex-initial flex items-center justify-center gap-3 px-8 py-4 rounded-3xl font-black transition-all shadow-lg active:scale-95 text-lg ${showFilters ? "bg-blue-600 text-white shadow-blue-200" : "bg-white text-slate-600 border-2 border-slate-100 shadow-slate-50 hover:bg-slate-50"}`}
                        >
                            <Filter size={20} />
                            <span>Bộ lọc</span>
                        </button>

                        {isAdmin && (
                            <button
                                onClick={handleAddRoom}
                                className="flex-1 md:flex-initial flex items-center justify-center gap-3 bg-slate-900 px-8 py-4 rounded-3xl font-black text-white hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-200 transition-all shadow-xl shadow-slate-200 active:scale-95 text-lg"
                            >
                                <Plus size={20} />
                                <span>Thêm phòng</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50 space-y-10 animate-in slide-in-from-top-4 fade-in duration-500 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Loai Phong */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Loại phòng</label>
                            <select
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all appearance-none"
                                value={filters.loaiPhong}
                                onChange={(e) => setFilters({ ...filters, loaiPhong: e.target.value })}
                            >
                                <option value="">Tất cả loại</option>
                                <option value="Phong_Don">Phòng đơn</option>
                                <option value="Phong_Doi">Phòng đôi</option>
                                <option value="Phong_O_Ghep">Ở ghép</option>
                            </select>
                        </div>

                        {/* Day Phong */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Dãy / Tầng</label>
                            <select
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all appearance-none"
                                value={filters.idDayPhong}
                                onChange={(e) => setFilters({ ...filters, idDayPhong: e.target.value })}
                            >
                                <option value="">Tất cả dãy</option>
                                {dayPhongs.map(day => (
                                    <option key={day._id} value={day._id}>Dãy {day.soDay} - {day.viTri}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Trạng thái</label>
                            <div className="flex p-1.5 bg-slate-50 border border-slate-200 rounded-2xl gap-2">
                                <button
                                    onClick={() => setFilters({ ...filters, trangThai: "" })}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${filters.trangThai === "" ? "bg-white text-blue-600 shadow-md" : "text-slate-400 hover:text-slate-600 hover:bg-white/50"}`}
                                >
                                    TẤT CẢ
                                </button>
                                <button
                                    onClick={() => setFilters({ ...filters, trangThai: "Trong" })}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${filters.trangThai === "Trong" ? "bg-white text-green-600 shadow-md" : "text-slate-400 hover:text-slate-600 hover:bg-white/50"}`}
                                >
                                    CÒN TRỐNG
                                </button>
                            </div>
                        </div>

                        {/* Reset */}
                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ search: "", loaiPhong: "", idDayPhong: "", minPrice: "", maxPrice: "", trangThai: "" })}
                                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
                            >
                                <RotateCcw size={18} />
                                LÀM MỚI BỘ LỌC
                            </button>
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="pt-6 border-t border-slate-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 md:mb-0">Khoảng giá (VNĐ)</label>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-black text-blue-600">{Number(filters.minPrice || 0).toLocaleString()}đ</span>
                                <div className="w-8 h-px bg-slate-200"></div>
                                <span className="text-sm font-black text-blue-600">{filters.maxPrice ? Number(filters.maxPrice).toLocaleString() : "Không giới hạn"}đ</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <input
                                type="number"
                                placeholder="Từ..."
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                value={filters.minPrice}
                                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                            />
                            <input
                                type="number"
                                placeholder="Đến..."
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                value={filters.maxPrice}
                                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            )
            }

            {/* Room Grid */}
            {
                loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-slate-500 font-black text-lg animate-pulse tracking-tight">Đang tải phòng phù hợp...</p>
                    </div>
                ) : rooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {rooms.map((room, index) => (
                            <RoomCard
                                key={room._id}
                                room={getDisplayRoom(room, index)}
                                isAdmin={isAdmin}
                                onEdit={handleEditRoom}
                                onDelete={handleDeleteRoom}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center bg-white border border-dashed border-slate-300 rounded-[3rem] shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Search size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Không tìm thấy phòng</h3>
                        <p className="text-slate-400 font-medium max-w-xs mx-auto">Vui lòng thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                    </div>
                )
            }

            <RoomFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchRooms}
                editingRoom={editingRoom}
            />
        </div>
    );
}
