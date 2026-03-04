import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
    ChevronLeft,
    Maximize,
    User,
    Layers,
    Package,
    Info,
    Shield,
    Loader2,
    Zap,
    Droplets
} from "lucide-react";
import { roomService, type Room } from "../services/roomService";
import { utilityService, type GiaDienNuoc } from "../services/utilityService";
import { bookingService } from "../services/bookingService";
import { useAuthStore } from "../store/authStore";
import { toast } from "sonner";
import { resolveBackendAssetUrl } from "../utils/url";

export default function RoomDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingDate, setBookingDate] = useState("");
    const [bookingNote, setBookingNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { user } = useAuthStore();
    const [utilityPrices, setUtilityPrices] = useState<GiaDienNuoc | null>(null);

    useEffect(() => {
        const fetchRoom = async () => {
            if (!id) return;
            try {
                const data = await roomService.getPhongById(id);
                setRoom(data);
            } catch (error) {
                console.error("Lá»—i khi táº£i chi tiáº¿t phÃ²ng:", error);
                toast.error("KhÃ´ng thá»ƒ táº£i thÃ´ng tin phÃ²ng");
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
                console.error("Lá»—i khi táº£i giÃ¡ Ä‘iá»‡n nÆ°á»›c:", error);
            }
        };
        fetchPrices();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Äang táº£i thÃ´ng tin chi tiáº¿t...</p>
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
        if (!user) return toast.error("Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ Ä‘áº·t lá»‹ch");
        if (!bookingDate) return toast.error("Vui lÃ²ng chá»n ngÃ y háº¹n");

        setSubmitting(true);
        try {
            await bookingService.createBooking({
                idPhong: id!,
                ngayDat: bookingDate,
                ghiChu: bookingNote
            });
            toast.success("Gá»­i yÃªu cáº§u Ä‘áº·t lá»‹ch thÃ nh cÃ´ng");
            setIsBookingModalOpen(false);
        } catch (error: any) {
            console.error("Lá»—i Ä‘áº·t lá»‹ch:", error);
            const data = error.response?.data;
            let errorMessage = "Lá»—i khi gá»­i yÃªu cáº§u";

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
                    Quay láº¡i danh sÃ¡ch
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                    {/* Left: Image Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 shadow-lg relative">
                            <img
                                src={images[activeImage]}
                                alt={room.tenPhong}
                                className="w-full h-full object-cover"
                            />
                            {room.trangThai !== "Trong" && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                    <span className="bg-white/90 px-6 py-2 rounded-full font-black text-red-600 shadow-xl border border-red-100">ÄÃƒ CÃ“ NGÆ¯á»œI THUÃŠ</span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
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
                                    {room.trangThai === "Trong" ? "ÄANG TRá»NG" : "ÄÃƒ CHO THUÃŠ"}
                                </span>
                                {room.loaiPhong && (
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-wider font-sans">
                                        {room.loaiPhong}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight mb-2">
                                {room.tenPhong}
                            </h1>
                            <p className="text-2xl sm:text-3xl font-black text-blue-600">
                                {room.giaPhong?.toLocaleString("vi-VN")}
                                <span className="text-sm font-medium text-slate-400 ml-1 italic font-sans uppercase">VNÄ/thÃ¡ng</span>
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <Maximize size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Diá»‡n tÃ­ch</p>
                                    <p className="text-lg font-bold text-slate-800">{room.dienTich}mÂ²</p>
                                </div>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Sá»©c chá»©a</p>
                                    <p className="text-lg font-bold text-slate-800">{room.sucChua} ngÆ°á»i</p>
                                </div>
                            </div>
                        </div>

                        {/* Service Costs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow group">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Tiá»n Ä‘iá»‡n</p>
                                    <p className="text-lg font-bold text-slate-800">
                                        {utilityPrices?.giaDien?.toLocaleString("vi-VN") || "3.500"}Ä‘
                                        <span className="text-[10px] ml-1 text-slate-400 font-medium">/kWh</span>
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow group">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                                    <Droplets size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Tiá»n nÆ°á»›c</p>
                                    <p className="text-lg font-bold text-slate-800">
                                        {utilityPrices?.giaNuoc?.toLocaleString("vi-VN") || "15.000"}Ä‘
                                        <span className="text-[10px] ml-1 text-slate-400 font-medium">/mÂ³</span>
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
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Vá»‹ trÃ­</p>
                                        <p className="font-bold text-slate-700">DÃ£y {room.idDayPhong.soDay} - {room.idDayPhong.tenDay}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield size={18} className="text-blue-600" />
                                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">CÆ¡ sá»Ÿ váº­t cháº¥t</h3>
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
                                        <p className="text-slate-400 italic text-sm">ChÆ°a cÃ³ thÃ´ng tin váº­t tÆ°</p>
                                    )}
                                </div>
                            </div>

                            {room.moTa && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Info size={18} className="text-blue-600" />
                                        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">MÃ´ táº£ thÃªm</h3>
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
                                    Äáº·t lá»‹ch xem ngay
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Booking Modal */}
                {isBookingModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-md rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="bg-blue-600 p-5 sm:p-8 text-white relative">
                                <button
                                    onClick={() => setIsBookingModalOpen(false)}
                                    className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <ChevronLeft size={24} className="rotate-90" />
                                </button>
                                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Äáº·t lá»‹ch háº¹n</h2>
                                <p className="text-blue-100 font-medium italic">Chá»n thá»i gian báº¡n mong muá»‘n xem phÃ²ng</p>
                            </div>
                            <form onSubmit={handleBookingSubmit} className="p-5 sm:p-8 space-y-5 sm:space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">NgÃ y mong muá»‘n</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                        value={bookingDate}
                                        onChange={(e) => setBookingDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Ghi chÃº thÃªm</label>
                                    <textarea
                                        className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all min-h-[100px]"
                                        placeholder="TÃ´i muá»‘n xem phÃ²ng vÃ o buá»•i sÃ¡ng..."
                                        value={bookingNote}
                                        onChange={(e) => setBookingNote(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-blue-600 text-white py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all disabled:opacity-50 disabled:scale-100 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {submitting ? <Loader2 className="animate-spin" /> : "Gá»­i yÃªu cáº§u ngay"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}



