import { useEffect, useState } from "react";
import {
    Calendar,
    CheckCircle2,
    XCircle,
    User,
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
                        Lịch xem phòng
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium italic">
                        Quản lý các yêu cầu hẹn xem phòng từ khách hàng
                    </p>
                </div>
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
                            {isAdmin && (
                                <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setEditingBooking({ ...booking })}
                                        className="p-2 bg-white/80 backdrop-blur shadow-sm border border-slate-100 rounded-full text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(booking._id)}
                                        className="p-2 bg-white/80 backdrop-blur shadow-sm border border-slate-100 rounded-full text-red-600 hover:bg-red-600 hover:text-white transition-all"
                                        title="Xóa"
                                    >
                                        <Trash2 size={16} />
                                    </button>
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

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Khách hàng</p>
                                            <p className="font-bold text-slate-800">{booking.idKhach?.hoVaTen || "Khách ẩn danh"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
                                            <Home size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Phòng đăng ký</p>
                                            <p className="font-bold text-slate-800">{booking.idPhong?.tenPhong || "Phòng đã xóa"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Ngày hẹn xem</p>
                                            <p className="font-bold text-slate-800">{new Date(booking.ngayDat).toLocaleDateString("vi-VN")}</p>
                                        </div>
                                    </div>

                                    {booking.idKhach?.sdt && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                                <Phone size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Số điện thoại</p>
                                                <p className="font-bold text-slate-800">{booking.idKhach.sdt}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {booking.ghiChu && (
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-sm text-slate-600 font-medium">
                                        "{booking.ghiChu}"
                                    </div>
                                )}

                                {isAdmin && booking.trangThai === "Cho_Xac_Nhan" && (
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => handleConfirm(booking._id)}
                                            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={16} /> Xác nhận
                                        </button>
                                        <button
                                            onClick={() => handleCancel(booking._id)}
                                            className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-sm hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={16} /> Hủy bỏ
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl">
                    <p className="text-slate-400 font-medium italic">Không có yêu cầu nào phù hợp.</p>
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
