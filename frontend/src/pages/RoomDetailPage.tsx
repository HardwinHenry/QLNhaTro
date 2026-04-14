import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
    ChevronLeft,
    Maximize,
    Layers,
    Package,
    Info,
    Shield,
    Loader2,
    Zap,
    Droplets,
    Clock,
    CalendarDays
} from "lucide-react";
import { roomService, type Room } from "../services/roomService";
import { utilityService, type GiaDienNuoc } from "../services/utilityService";
import { bookingService } from "../services/bookingService";
import { slotService, type BookingSlot } from "../services/slotService";
import { useAuthStore } from "../store/authStore";
import { formatVi } from "../utils/dateFormatter";
import { toast } from "sonner";
import { resolveBackendAssetUrl } from "../utils/url";
import ImageViewer from "../components/ImageViewer";

const loaiPhongLabels: Record<string, string> = {
    Co_Gac: "Có gác",
    Khong_Gac: "Không gác",
};

export default function RoomDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [slots, setSlots] = useState<BookingSlot[]>([]);
    const [selectedSlotId, setSelectedSlotId] = useState<string>("");
    const [bookingNote, setBookingNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { user } = useAuthStore();
    const [utilityPrices, setUtilityPrices] = useState<GiaDienNuoc | null>(null);

    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewIndex, setViewIndex] = useState(0);

    const openViewer = (index: number) => {
        setViewIndex(index);
        setViewerOpen(true);
    };

    useEffect(() => {
        const fetchRoom = async () => {
            if (!id) return;
            try {
                const data = await roomService.getPhongById(id);
                setRoom(data);
            } catch (error) {
                console.error("Lỗi khi tải chi tiết phòng:", error);
                toast.error("Không thể tải thông tin phòng");
                navigate("/");
            } finally {
                setLoading(false);
            }
        };

        fetchRoom();

        const fetchPrices = async () => {
            try {
                const data = await utilityService.getLatestGia();
                setUtilityPrices(data);
            } catch (error) {
                console.error("Lỗi khi tải giá điện nước:", error);
            }
        };
        fetchPrices();

        const fetchSlots = async () => {
            try {
                const data = await slotService.getAllSlots();
                // Filter only 'Trong' slots and future ones (backend does this but safety first)
                setSlots(data);
            } catch (error) {
                console.error("Lỗi tải khung giờ:", error);
            }
        };
        fetchSlots();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Đang tải thông tin chi tiết...</p>
            </div>
        );
    }

    if (!room) return null;

    // Helper for images (same logic as HomePage)
    const getImages = () => {
        let rawImages: string[] = [];
        if (Array.isArray(room.hinhAnh)) {
            rawImages = room.hinhAnh;
        } else if (typeof room.hinhAnh === 'string' && room.hinhAnh) {
            rawImages = [room.hinhAnh];
        }

        if (rawImages.length > 0) {
            return rawImages.map(img => img.startsWith('/uploads') ? resolveBackendAssetUrl(img) : img);
        }

        // Placeholder images if none exist
        return ["/Phong01.jpg", "/Phong02.jpg", "/Phong03.jpg"];
    };

    const images = getImages();


    const handleBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return toast.error("Vui lòng đăng nhập để đặt lịch");
        if (!selectedSlotId) return toast.error("Vui lòng chọn khung giờ hẹn");

        const selectedSlot = slots.find(s => s._id === selectedSlotId);
        if (!selectedSlot) return toast.error("Khung giờ không hợp lệ");

        setSubmitting(true);
        try {
            await bookingService.createBooking({
                idPhong: id!,
                idSlot: selectedSlotId,
                ngayDat: selectedSlot.thoiGianBatDau,
                ghiChu: bookingNote
            });
            toast.success("Gửi yêu cầu đặt lịch thành công");
            setIsBookingModalOpen(false);
            // Refresh slots
            const data = await slotService.getAllSlots();
            setSlots(data);
        } catch (error: any) {
            console.error("Lỗi đặt lịch:", error);
            const data = error.response?.data;
            let errorMessage = "Lỗi khi gửi yêu cầu";

            if (data?.message) {
                errorMessage = data.detail || data.message;
            }

            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white -mt-4 sm:-mt-8 pt-4 sm:pt-8">
            <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12 sm:pb-20 px-1 sm:px-4">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Quay lại danh sách
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                    {/* Left: Image Gallery ... */}
                    <div className="space-y-4">
                        <div
                            className="aspect-[4/3] rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 shadow-lg relative cursor-pointer"
                            onClick={() => openViewer(activeImage)}
                        >
                            <img
                                src={images[activeImage]}
                                alt={room.tenPhong}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {room.trangThai !== "Trong" && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                    <span className="bg-white/90 px-6 py-2 rounded-full font-black text-red-600 shadow-xl border border-red-100">ĐÃ CÓ NGƯỜI THUÊ</span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    onDoubleClick={() => openViewer(idx)}
                                    className={`flex-shrink-0 w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? "border-blue-600 shadow-md" : "border-transparent opacity-70 hover:opacity-100"}`}
                                >
                                    <img src={img} alt={`${room.tenPhong}-${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Room Info */}
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${room.trangThai === "Trong" ? "bg-green-100 text-green-700 font-sans" : "bg-red-100 text-red-700 font-sans"}`}>
                                    {room.trangThai === "Trong" ? "ĐANG TRỐNG" : "ĐÃ CHO THUÊ"}
                                </span>
                                {room.loaiPhong && (
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-wider font-sans">
                                        {loaiPhongLabels[room.loaiPhong] || room.loaiPhong}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight mb-2">
                                {room.tenPhong}
                            </h1>
                            <p className="text-2xl sm:text-3xl font-black text-blue-600">
                                {room.giaPhong?.toLocaleString("vi-VN")}
                                <span className="text-sm font-medium text-slate-400 ml-1 italic font-sans uppercase">VNĐ/tháng</span>
                            </p>
                        </div>

                        {/* Features & Service Costs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <Maximize size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Diện tích</p>
                                    <p className="text-lg font-bold text-slate-800">{room.dienTich}m²</p>
                                </div>
                            </div>

                            <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow group">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Tiền điện</p>
                                    <p className="text-lg font-bold text-slate-800">
                                        {utilityPrices?.giaDien?.toLocaleString("vi-VN") || "3.500"}đ
                                        <span className="text-[10px] ml-1 text-slate-400 font-medium">/kWh</span>
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow group">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                                    <Droplets size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Tiền nước</p>
                                    <p className="text-lg font-bold text-slate-800">
                                        {utilityPrices?.giaNuoc?.toLocaleString("vi-VN") || "15.000"}đ
                                        <span className="text-[10px] ml-1 text-slate-400 font-medium">/m³</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description/Location */}
                        <div className="space-y-6">
                            {room.idDayPhong && (
                                <div className="flex items-center gap-4 text-slate-600 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <Layers size={20} className="text-slate-400" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Vị trí</p>
                                        <p className="font-bold text-slate-700">Tầng {room.idDayPhong.tang === 0 ? "Trệt" : room.idDayPhong.tang} - Dãy {room.idDayPhong.soDay}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield size={18} className="text-blue-600" />
                                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Cơ sở vật chất</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {room.vatTu && room.vatTu.length > 0 ? (
                                        room.vatTu.map((v, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 shadow-sm">
                                                <Package size={14} className="text-blue-500" />
                                                {v.tenVatTu}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-slate-400 italic text-sm">Chưa có thông tin vật tư</p>
                                    )}
                                </div>
                            </div>

                            {room.moTa && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Info size={18} className="text-blue-600" />
                                        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Mô tả thêm</h3>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed font-medium bg-white p-6 rounded-3xl border border-slate-100 italic">
                                        "{room.moTa}"
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Booking/Contact Section */}
                        {room.trangThai === "Trong" && user?.vaiTro !== "Chu_Tro" && (
                            <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-4">
                                <button
                                    onClick={() => setIsBookingModalOpen(true)}
                                    className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95"
                                >
                                    Đặt lịch xem ngay
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Booking Modal */}
                {isBookingModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-lg rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                            <div className="bg-blue-600 p-5 sm:p-8 text-white relative shrink-0">
                                <button
                                    onClick={() => setIsBookingModalOpen(false)}
                                    className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <ChevronLeft size={24} className="rotate-90" />
                                </button>
                                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 uppercase">Chọn lịch hẹn rảnh</h2>
                                <p className="text-blue-100 font-medium italic">Vui lòng chọn một trong các khung giờ chủ trọ đã cấu hình</p>
                            </div>
                            
                            <form onSubmit={handleBookingSubmit} className="p-5 sm:p-8 space-y-6 overflow-y-auto flex-1 scrollbar-hide">
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <CalendarDays size={14} className="text-blue-500" />
                                        Khung giờ khả dụng
                                    </label>
                                    
                                    {slots.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                            {slots.map((slot) => (
                                                <button
                                                    key={slot._id}
                                                    type="button"
                                                    onClick={() => setSelectedSlotId(slot._id)}
                                                    className={`p-4 rounded-2xl border-2 text-left transition-all relative group ${selectedSlotId === slot._id ? "border-blue-600 bg-blue-50 shadow-md ring-1 ring-blue-600/20" : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white"}`}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${selectedSlotId === slot._id ? "text-blue-600" : "text-slate-400"}`}>
                                                            {formatVi(slot.thoiGianBatDau, { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                           <span className={`text-base font-black ${selectedSlotId === slot._id ? "text-blue-700" : "text-slate-700"}`}>
                                                               {formatVi(slot.thoiGianBatDau, { hour: '2-digit', minute: '2-digit' })}
                                                           </span>
                                                           <span className="text-slate-300 font-bold">-</span>
                                                           <span className={`text-xs font-bold ${selectedSlotId === slot._id ? "text-blue-400" : "text-slate-400"}`}>
                                                               {formatVi(slot.thoiGianKetThuc, { hour: '2-digit', minute: '2-digit' })}
                                                           </span>
                                                        </div>
                                                        <div className="mt-1.5 flex items-center justify-between">
                                                           <span className={`text-[9px] font-black uppercase ${slot.soLuongDaDat >= slot.soLuongToiDa ? 'text-red-500' : 'text-blue-500'}`}>
                                                               {slot.soLuongDaDat}/{slot.soLuongToiDa} Chỗ
                                                           </span>
                                                        </div>
                                                    </div>
                                                    {selectedSlotId === slot._id && (
                                                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
                                                            <div className="w-2 h-2 bg-white rounded-full" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                            <Clock size={32} className="mx-auto text-slate-300 mb-2" />
                                            <p className="text-slate-400 font-bold italic text-sm">Hiện chưa có khung giờ rảnh nào khả dụng</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Ghi chú cho chủ trọ</label>
                                    <textarea
                                        className="w-full px-4 sm:px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all min-h-[100px] resize-none"
                                        placeholder="Để lại ghi chú nếu bạn có yêu cầu đặc biệt..."
                                        value={bookingNote}
                                        onChange={(e) => setBookingNote(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || !selectedSlotId}
                                    className="w-full bg-blue-600 text-white py-4 sm:py-5 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {submitting ? <Loader2 className="animate-spin" /> : "XÁC NHẬN ĐẶT LỊCH NGAY"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <ImageViewer
                images={images}
                currentIndex={viewIndex}
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
            />
        </div>
    );
}
