import { useState, useEffect, useRef } from "react";
import {
    Wrench,
    Plus,
    Clock,
    Play,
    CheckCircle2,
    Image as ImageIcon,
    Camera,
    X,
    Loader2,
    Filter,
    ChevronDown,
    Trash2,
    DoorOpen,
    Search
} from "lucide-react";
import { maintenanceService, type YeuCauBaoTri } from "../services/maintenanceService";
import { roomService, type Room } from "../services/roomService";
import { useAuthStore } from "../store/authStore";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const API_URL = "http://localhost:5001";

export default function MaintenancePage() {
    const { user } = useAuthStore();
    const isAdmin = user?.vaiTro === "Chu_Tro";

    const [requests, setRequests] = useState<YeuCauBaoTri[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [roomAssets, setRoomAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("Tat_Ca");

    // Searchable Combobox states
    const [roomSearch, setRoomSearch] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    const { register, handleSubmit, reset, watch, setValue } = useForm();
    const selectedRoomId = watch("idPhong");
    const selectedVatTuId = watch("idVatTu");

    useEffect(() => {
        fetchRequests();
        fetchRooms();
    }, []);

    // Handle clicking outside of suggestions
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch assets when room changes
    useEffect(() => {
        if (selectedRoomId) {
            fetchRoomAssets(selectedRoomId);
            setValue("idVatTu", ""); // Reset asset selection when room changes
        } else {
            setRoomAssets([]);
        }
    }, [selectedRoomId]);

    const fetchRoomAssets = async (roomId: string) => {
        try {
            const data = await roomService.getPhongById(roomId);
            setRoomAssets(data.vatTu || []);
        } catch (error) {
            console.error("Lỗi khi tải thiết bị trong phòng:", error);
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = isAdmin ? await maintenanceService.getAll() : await maintenanceService.getMine();
            setRequests(data);
        } catch (error) {
            toast.error("Không thể tải danh sách yêu cầu");
        } finally {
            setLoading(false);
        }
    };

    const fetchRooms = async () => {
        try {
            const data = await roomService.getAllPhongs();
            setRooms(data);

            // Tự động điền phòng hiện tại của khách nếu có
            if (!isAdmin && user?.phongHienTai?._id) {
                setRoomSearch(user.phongHienTai.tenPhong);
                setValue("idPhong", user.phongHienTai._id);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách phòng:", error);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("moTa", data.moTa);
            formData.append("idPhong", data.idPhong);
            if (data.idVatTu) {
                formData.append("idVatTu", data.idVatTu);
            }
            if (selectedImage) {
                formData.append("hinhAnh", selectedImage);
            }

            await maintenanceService.create(formData);
            toast.success("Gửi yêu cầu bảo trì thành công");
            setIsCreateModalOpen(false);
            reset();
            setRoomSearch("");
            setSelectedImage(null);
            setImagePreview(null);
            fetchRequests();
        } catch (error) {
            toast.error("Gửi yêu cầu thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await maintenanceService.updateStatus(id, newStatus);
            toast.success("Đã cập nhật trạng thái");
            fetchRequests();
        } catch (error) {
            toast.error("Cập nhật thất bại");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Xóa yêu cầu này?")) return;
        try {
            await maintenanceService.delete(id);
            toast.success("Đã xóa yêu cầu");
            fetchRequests();
        } catch (error) {
            toast.error("Xóa thất bại");
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "Dang_Cho":
                return { label: "Đang chờ", icon: Clock, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" };
            case "Dang_Xu_Ly":
                return { label: "Đang xử lý", icon: Play, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" };
            case "Da_Hoan_Thanh":
                return { label: "Đã xong", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" };
            default:
                return { label: status, icon: Clock, color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-100" };
        }
    };

    const filteredRequests = requests.filter(r =>
        filterStatus === "Tat_Ca" || r.trangThai === filterStatus
    );

    const filteredRooms = rooms.filter(r =>
        r.tenPhong.toLowerCase().includes(roomSearch.toLowerCase()) ||
        r._id.toLowerCase().includes(roomSearch.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Yêu cầu bảo trì</h1>
                    <p className="text-slate-500 text-sm">
                        {isAdmin ? "Quản lý và cập nhật tiến độ sửa chữa từ người thuê" : "Gửi yêu cầu sửa chữa và theo dõi tiến độ"}
                    </p>
                </div>
                {!isAdmin && (
                    <button
                        onClick={() => {
                            if (rooms.length === 0) {
                                toast.error("Bạn hiện không có phòng nào đang thuê để yêu cầu bảo trì");
                                return;
                            }
                            setIsCreateModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200 font-medium"
                    >
                        <Plus size={18} />
                        Gửi yêu cầu mới
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {["Tat_Ca", "Dang_Cho", "Dang_Xu_Ly", "Da_Hoan_Thanh"].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${filterStatus === s
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                            }`}
                    >
                        {s === "Tat_Ca" ? "Tất cả" : getStatusInfo(s).label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
                            <div className="flex justify-between items-start">
                                <div className="w-24 h-6 bg-slate-100 rounded-full"></div>
                                <div className="w-20 h-4 bg-slate-100 rounded"></div>
                            </div>
                            <div className="w-full h-40 bg-slate-50 rounded-xl"></div>
                            <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                        </div>
                    ))
                ) : filteredRequests.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wrench size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">Không có yêu cầu nào</h3>
                        <p className="text-slate-500">Mọi thứ hiện tại đều ổn định</p>
                    </div>
                ) : (
                    filteredRequests.map((req) => {
                        const status = getStatusInfo(req.trangThai);
                        return (
                            <div key={req._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group relative">
                                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${status.bg} ${status.color} ${status.border} border`}>
                                        <status.icon size={12} />
                                        {status.label}
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-400">
                                        {format(new Date(req.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                                    </span>
                                </div>

                                {req.hinhAnh && (
                                    <div
                                        className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer"
                                        onClick={() => window.open(`${API_URL}${req.hinhAnh}`, "_blank")}
                                    >
                                        <img
                                            src={`${API_URL}${req.hinhAnh}`}
                                            alt="Sự cố"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ImageIcon className="text-white" size={24} />
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 flex-1 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-slate-800">Phòng {req.idPhong?.tenPhong || "N/A"}</h4>
                                        {isAdmin && (
                                            <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                                                {req.idKhach?.hoTen || req.idKhach?.tenDangNhap}
                                            </span>
                                        )}
                                    </div>
                                    {req.idVatTu && (
                                        <div className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-100 w-fit rounded-lg text-slate-600">
                                            <Wrench size={12} className="text-slate-400" />
                                            <span className="text-[11px] font-bold">Thiết bị: {req.idVatTu.tenVatTu}</span>
                                        </div>
                                    )}
                                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                                        {req.moTa}
                                    </p>
                                </div>

                                {isAdmin && (
                                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => handleStatusUpdate(req._id, "Dang_Cho")}
                                            className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border ${req.trangThai === "Dang_Cho" ? "bg-amber-100 border-amber-200 text-amber-700" : "bg-white border-slate-200 text-slate-400 hover:border-amber-200 hover:text-amber-600"}`}
                                        >
                                            Chờ
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(req._id, "Dang_Xu_Ly")}
                                            className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border ${req.trangThai === "Dang_Xu_Ly" ? "bg-blue-100 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-400 hover:border-blue-200 hover:text-blue-600"}`}
                                        >
                                            Xử lý
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(req._id, "Da_Hoan_Thanh")}
                                            className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border ${req.trangThai === "Da_Hoan_Thanh" ? "bg-emerald-100 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-400 hover:border-emerald-200 hover:text-emerald-600"}`}
                                        >
                                            Xong
                                        </button>
                                    </div>
                                )}

                                {isAdmin && (
                                    <button
                                        onClick={() => handleDelete(req._id)}
                                        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm text-red-500 rounded-lg lg:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 shadow-sm z-10"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            <div>
                                <h3 className="text-xl font-bold">Gửi yêu cầu bảo trì</h3>
                                <p className="text-blue-100 text-xs">Hãy mô tả chi tiết sự cố bạn gặp phải</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                            <div className="relative" ref={suggestionRef}>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Chọn hoặc nhập mã phòng gặp sự cố</label>
                                <div className="relative">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Nhập tên phòng hoặc mã phòng..."
                                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                                        value={roomSearch}
                                        onChange={(e) => {
                                            setRoomSearch(e.target.value);
                                            setShowSuggestions(true);
                                            // Optional: clear the actual form value if it doesn't match
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                    />
                                    <input type="hidden" {...register("idPhong", { required: true })} />
                                </div>

                                {showSuggestions && filteredRooms.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                        {filteredRooms.map(r => (
                                            <div
                                                key={r._id}
                                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between group transition-colors"
                                                onClick={() => {
                                                    setRoomSearch(r.tenPhong);
                                                    setValue("idPhong", r._id);
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                        <DoorOpen size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 group-hover:text-blue-700">{r.tenPhong}</p>
                                                        <p className="text-[10px] text-slate-400">ID: {r._id.slice(-6)}...</p>
                                                    </div>
                                                </div>
                                                <CheckCircle2 size={16} className={`text-blue-600 opacity-0 ${watch("idPhong") === r._id ? "opacity-100" : ""}`} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedRoomId && roomAssets.length > 0 && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-slate-700">Chọn thiết bị gặp sự cố</label>
                                    <div className="flex flex-wrap gap-2">
                                        {roomAssets.map((asset) => (
                                            <button
                                                key={asset._id}
                                                type="button"
                                                onClick={() => {
                                                    if (selectedVatTuId === asset._id) {
                                                        setValue("idVatTu", "");
                                                    } else {
                                                        setValue("idVatTu", asset._id);
                                                    }
                                                }}
                                                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 ${selectedVatTuId === asset._id
                                                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                                                    }`}
                                            >
                                                <Filter size={14} className={selectedVatTuId === asset._id ? "text-blue-200" : "text-slate-400"} />
                                                {asset.tenVatTu}
                                            </button>
                                        ))}
                                        <input type="hidden" {...register("idVatTu")} />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Mô tả sự cố</label>
                                <textarea
                                    {...register("moTa", { required: true })}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm resize-none"
                                    placeholder="Vd: Vòi nước bồn tắm bị rò rỉ, bóng đèn hành lang không sáng..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Hình ảnh minh họa</label>
                                <div
                                    className={`relative border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${imagePreview ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                                        }`}
                                    onClick={() => document.getElementById("photo-upload")?.click()}
                                >
                                    {imagePreview ? (
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm">
                                            <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImagePreview(null);
                                                    setSelectedImage(null);
                                                }}
                                                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                <Camera size={24} />
                                            </div>
                                            <p className="text-sm font-medium text-slate-600">Bấm để tải ảnh lên</p>
                                            <p className="text-xs text-slate-400">JPG, PNG</p>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        id="photo-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all text-sm"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-3 bg-blue-600 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-sm"
                                >
                                    {submitting && <Loader2 size={18} className="animate-spin" />}
                                    Gửi yêu cầu ngay
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
