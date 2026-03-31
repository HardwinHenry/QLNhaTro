import { useEffect, useState } from "react";
import { Users, Search, Loader2, Phone, IdCard, ArrowRight, UserCheck, ShieldAlert } from "lucide-react";
import { getAllUsers } from "../services/authService";
import { formatVi } from "../utils/dateFormatter";
import { toast } from "sonner";

interface Customer {
    _id: string;
    tenDangNhap: string;
    hoVaTen: string;
    sdt?: string;
    cccd?: string;
    vaiTro: string;
    createdAt: string;
    phongHienTai?: {
        _id: string;
        tenPhong: string;
        dienTich: number;
        loaiPhong: string;
    };
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchCustomers = async () => {
        try {
            const data = await getAllUsers();
            // Filter only guests
            const filtered = data.filter((u: any) => u.vaiTro === "Khach");
            setCustomers(filtered);
        } catch (error) {
            toast.error("Lỗi khi tải danh sách khách hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const filteredCustomers = customers.filter(c =>
        c.hoVaTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tenDangNhap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sdt?.includes(searchTerm) ||
        c.cccd?.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium italic">Đang tải danh sách khách hàng...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <Users className="text-blue-600" size={36} />
                        Quản lý khách
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium italic">Xem và quản lý tất cả người dùng trong hệ thống</p>
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Tìm theo tên, SĐT, CCCD..."
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-3xl text-sm font-bold focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 border-transparent transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                        <div key={customer._id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-500 group relative overflow-hidden">
                            {/* Decorative background element */}
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg border-2 border-white">
                                            {customer.hoVaTen?.charAt(0).toUpperCase() || customer.tenDangNhap.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-blue-700 transition-colors">{customer.hoVaTen || "Chưa đặt tên"}</h3>
                                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1 italic">@{customer.tenDangNhap}</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-widest">
                                        Active
                                    </span>
                                </div>

                                <div className="space-y-4 pt-6 mt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-4 group/item">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover/item:bg-blue-50 group-hover/item:text-blue-500 transition-colors">
                                            <Phone size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Số điện thoại</p>
                                            <p className="text-sm font-bold text-slate-700">{customer.sdt || "Chưa cập nhật"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 group/item">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover/item:bg-blue-50 group-hover/item:text-blue-500 transition-colors">
                                            <IdCard size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Số CCCD / CMND</p>
                                            <p className="text-sm font-bold text-slate-700">{customer.cccd || "N/A"}</p>
                                        </div>
                                    </div>

                                    {customer.phongHienTai && (
                                        <div className="flex items-center gap-4 group/item bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
                                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                                <Users size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Đang thuê</p>
                                                <p className="text-sm font-black text-blue-700">{customer.phongHienTai.tenPhong}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <UserCheck size={14} className="text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Tham gia: {formatVi(customer.createdAt)}</span>
                                    </div>
                                    <button className="text-blue-600 p-2 hover:bg-blue-50 rounded-xl transition-all">
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <ShieldAlert size={40} className="text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">Không tìm thấy khách hàng</h3>
                        <p className="text-slate-400 font-bold italic">Hãy thử thay đổi từ khóa tìm kiếm của bạn</p>
                    </div>
                )}
            </div>
        </div>
    );
}
