import { useEffect, useState } from "react";
import {
    Calendar,
    CheckCircle2,
    XCircle,
    Phone,
    Home,
    Loader2,
    Trash2,
    Edit2,
    Search
} from "lucide-react";
import { bookingService, type BookingRequest } from "../services/bookingService";
import { toast } from "sonner";
import { useAuthStore } from "../store/authStore";
import Swal from "sweetalert2";

export default function BookingsPage() {
    const [bookings, setBookings] = useState<BookingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingBooking, setEditingBooking] = useState<BookingRequest | null>(null);
    const { user } = useAuthStore();
    const isAdmin = user?.vaiTro === "Chu_Tro";

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const data = await bookingService.getAllBookings();
            setBookings(data);
        } catch (error) {
            toast.error("Không thể tải danh sách yêu cầu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleConfirm = async (id: string) => {
        try {
            await bookingService.confirmBooking(id);
            toast.success("Đã xác nhận lịch hẹn");
            fetchBookings();
        } catch (error) {
            toast.error("Lỗi khi xác nhận");
        }
    };

    const handleCancel = async (id: string) => {
        try {
            await bookingService.cancelBooking(id);
            toast.success("Đã hủy lịch hẹn");
            fetchBookings();
        } catch (error) {
            toast.error("Lỗi khi hủy");
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: "Xác nhận xóa?",
            text: "Bạn không thể hoàn tác sau khi xóa!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Đồng ý, xóa nó!",
            cancelButtonText: "Hủy"
        });

        if (result.isConfirmed) {
            try {
                await bookingService.deleteBooking(id);
                toast.success("Đã xóa lịch hẹn");
                fetchBookings();
            } catch (error) {
                toast.error("Lỗi khi xóa");
            }
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBooking) return;

        try {
            await bookingService.updateBooking(editingBooking._id, {
                ngayDat: editingBooking.ngayDat,
                ghiChu: editingBooking.ghiChu
            });
            toast.success("Cập nhật thành công");
            setEditingBooking(null);
            fetchBookings();
        } catch (error) {
            toast.error("Lỗi khi cập nhật");
        }
    };

    const filteredBookings = bookings.filter(b =>
        (b.idKhach?.hoVaTen || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.idPhong?.tenPhong || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Cho_Xac_Nhan": return "bg-amber-100 text-amber-700 border-amber-200";
            case "Da_Xac_Nhan": return "bg-green-100 text-green-700 border-green-200";
            case "Da_Huy": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "Cho_Xac_Nhan": return "Chờ xác nhận";
            case "Da_Xac_Nhan": return "Đã xác nhận";
            case "Da_Huy": return "Đã hủy";
            default: return status;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                        {isAdmin ? "Lịch xem phòng" : "Lịch hẹn của tôi"}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic">
                        {isAdmin
                            ? "Quản lý các yêu cầu hẹn xem phòng từ khách hàng"
                            : "Theo dõi các yêu cầu hẹn xem phòng bạn đã gửi"}
                    </p>
                </div>
                {isAdmin && (
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên khách, phòng..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full md:w-80 font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
                    <p className="text-slate-500 font-medium font-sans italic">Đang tải dữ liệu...</p>
                </div>
            ) : filteredBookings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBookings.map((booking) => (
                        <div key={booking._id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group relative">
                            {(isAdmin || (!isAdmin && booking.trangThai === "Cho_Xac_Nhan")) && (
                                <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setEditingBooking({ ...booking })}
                                        className="p-2 bg-white/80 backdrop-blur shadow-sm border border-slate-100 rounded-full text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    {!isAdmin ? (
                                        <button
                                            onClick={() => handleCancel(booking._id)}
                                            className="p-2 bg-white/80 backdrop-blur shadow-sm border border-slate-100 rounded-full text-red-600 hover:bg-red-600 hover:text-white transition-all"
                                            title="Hủy lịch hẹn"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleDelete(booking._id)}
                                            className="p-2 bg-white/80 backdrop-blur shadow-sm border border-slate-100 rounded-full text-red-600 hover:bg-red-600 hover:text-white transition-all"
                                            title="Xóa"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className="p-5 sm:p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${getStatusStyle(booking.trangThai)}`}>
                                        {getStatusLabel(booking.trangThai)}
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 mr-12">
                                        {new Date(booking.createdAt).toLocaleDateString("vi-VN")}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Customer Highlight Section (Only for Admin) */}
                                    {isAdmin ? (
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4 group-hover:bg-blue-50/50 group-hover:border-blue-100 transition-all">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 font-black text-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                {booking.idKhach?.hoVaTen?.charAt(0).toUpperCase() || "?"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5">Khách hàng</p>
                                                <h4 className="font-black text-slate-800 truncate text-base leading-tight">
                                                    {booking.idKhach?.hoVaTen || "Khách ẩn danh"}
                                                </h4>
                                                {booking.idKhach?.sdt ? (
                                                    <div className="flex items-center gap-1.5 mt-1 text-blue-600">
                                                        <Phone size={12} className="fill-current" />
                                                        <span className="text-sm font-black">{booking.idKhach.sdt}</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-400 font-medium italic mt-1">Chưa cập nhật SĐT</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-blue-600 border border-blue-500 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-blue-100">
                                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-sm font-black text-lg">
                                                <Home size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.1em] mb-0.5">Phòng bạn quan tâm</p>
                                                <h4 className="font-black text-white truncate text-lg leading-tight">
                                                    {booking.idPhong?.tenPhong || "Phòng đã xóa"}
                                                </h4>
                                                <p className="text-xs text-blue-100 font-bold mt-1">
                                                    {booking.idPhong?.giaPhong?.toLocaleString("vi-VN")}đ/tháng
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {!isAdmin ? (
                                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="w-10 h-10 bg-white text-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                                                <Calendar size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-0.5">Thời gian hẹn</p>
                                                <p className="font-black text-slate-800 text-base">{new Date(booking.ngayDat).toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-transparent group-hover:border-slate-100 transition-all">
                                                <div className="w-8 h-8 bg-white text-slate-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                                                    <Home size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Phòng đăng ký</p>
                                                    <p className="font-extrabold text-slate-800 text-sm truncate">{booking.idPhong?.tenPhong || "Phòng đã xóa"}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-transparent group-hover:border-slate-100 transition-all">
                                                <div className="w-8 h-8 bg-white text-purple-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                                                    <Calendar size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Ngày hẹn xem</p>
                                                    <p className="font-extrabold text-slate-800 text-sm">{new Date(booking.ngayDat).toLocaleDateString("vi-VN")}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {booking.ghiChu && (
                                    <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 italic text-sm text-slate-300 font-medium relative overflow-hidden group/note">
                                        <div className="absolute top-0 right-0 p-2 opacity-10">
                                            <Home size={48} />
                                        </div>
                                        <span className="relative z-10">"{booking.ghiChu}"</span>
                                    </div>
                                )}

                                {isAdmin && booking.trangThai === "Cho_Xac_Nhan" && (
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => handleConfirm(booking._id)}
                                            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                                        >
                                            <CheckCircle2 size={16} /> Xác nhận
                                        </button>
                                        <button
                                            onClick={() => handleCancel(booking._id)}
                                            className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={16} /> Từ chối
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem] shadow-sm max-w-2xl mx-auto">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <Calendar size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">
                        {isAdmin ? "Không có yêu cầu nào" : "Bạn chưa có lịch hẹn nào"}
                    </h3>
                    <p className="text-slate-400 font-medium max-w-xs mx-auto mb-8 italic">
                        {isAdmin
                            ? "Hiện tại chưa có khách hàng nào đặt lịch xem phòng."
                            : "Hãy chọn một căn phòng ưng ý và đặt lịch hẹn xem trực tiếp nhé!"}
                    </p>
                    {!isAdmin && (
                        <button
                            onClick={() => window.location.href = "/rooms"}
                            className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95"
                        >
                            Tìm phòng ngay
                        </button>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {editingBooking && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-black text-slate-800">Cập nhật lịch xem phòng</h2>
                            <p className="text-sm text-slate-500 italic mt-1 font-medium">Thay đổi thông tin lịch hẹn</p>
                        </div>
                        <form onSubmit={handleUpdate} className="p-5 sm:p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ngày hẹn xem</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-800"
                                    value={editingBooking.ngayDat.split("T")[0]}
                                    onChange={(e) => setEditingBooking({ ...editingBooking, ngayDat: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ghi chú</label>
                                <textarea
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-800 h-24 resize-none"
                                    value={editingBooking.ghiChu}
                                    onChange={(e) => setEditingBooking({ ...editingBooking, ghiChu: e.target.value })}
                                    placeholder="Thêm ghi chú..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingBooking(null)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                                >
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
