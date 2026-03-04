import { useAuthStore } from "../store/authStore";
import { User, Phone, IdCard, Shield, Mail, MapPin, Edit3, Camera } from "lucide-react";

export default function ProfilePage() {
    const { user } = useAuthStore();

    const infoItems = [
        { icon: User, label: "Tên đăng nhập", value: user?.tenDangNhap },
        { icon: Phone, label: "Số điện thoại", value: user?.sdt || "Chưa cập nhật" },
        { icon: IdCard, label: "Số CCCD", value: user?.cccd || "Chưa cập nhật" },
        { icon: Shield, label: "Vai trò", value: user?.vaiTro === "Chu_Tro" ? "Chủ trọ" : "Khách thuê" },

    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Trang cá nhân</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Thông tin tài khoản của bạn</p>
                </div>
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200">
                    <Edit3 size={18} />
                    Chỉnh sửa hồ sơ
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Avatar & Quick Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 flex flex-col items-center text-center shadow-sm">
                        <div className="relative group">
                            <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-4xl font-black border-4 border-white shadow-xl group-hover:bg-blue-200 transition-colors">
                                {user?.tenDangNhap?.charAt(0).toUpperCase()}
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg border-2 border-white hover:scale-110 transition-transform">
                                <Camera size={16} />
                            </button>
                        </div>
                        <h2 className="mt-6 font-black text-2xl text-slate-800">{user?.tenDangNhap}</h2>
                        <span className="mt-2 px-3 py-1 bg-blue-50 text-blue-600 text-[11px] font-bold rounded-full border border-blue-100 uppercase tracking-wider">
                            {user?.vaiTro === "Chu_Tro" ? "Chủ trọ" : "Khách thuê"}

                        </span>

                        <div className="w-full mt-8 pt-8 border-t border-slate-100 flex justify-around text-sm">
                            <div>
                                <p className="font-black text-slate-800">1+ năm</p>
                                <p className="text-slate-400 text-[11px] font-bold uppercase">Thành viên</p>
                            </div>
                            <div className="w-px bg-slate-100"></div>
                            <div>
                                <p className="font-black text-slate-800">Hoàn thiện</p>
                                <p className="text-slate-400 text-[11px] font-bold uppercase">Hồ sơ: 80%</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-900 rounded-3xl p-6 text-white shadow-xl shadow-blue-200">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Shield size={18} className="text-blue-300" />
                            Bảo mật tài khoản
                        </h3>
                        <p className="text-blue-100 text-sm leading-relaxed mb-6">
                            Tài khoản của bạn đang được bảo vệ bởi hệ thống xác thực 2 lớp.
                        </p>
                        <button className="w-full py-2 bg-blue-800 hover:bg-blue-700 rounded-xl text-sm font-bold transition-all border border-blue-700">
                            Đổi mật khẩu
                        </button>
                    </div>
                </div>

                {/* Right Column - Detailed Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100">
                            <h3 className="font-black text-slate-800">Thông tin chi tiết</h3>
                        </div>
                        <div className="p-5 sm:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                {infoItems.map((item, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <item.icon size={16} />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                                        </div>
                                        <p className="font-bold text-slate-700 pl-6">{item.value}</p>
                                    </div>
                                ))}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Mail size={16} />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">Email</span>
                                    </div>
                                    <p className="font-bold text-slate-700 pl-6 italic">Chưa liên kết</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <MapPin size={16} />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">Địa chỉ thường trú</span>
                                    </div>
                                    <p className="font-bold text-slate-700 pl-6 italic">Theo CCCD</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8">
                        <h3 className="font-black text-slate-800 mb-6 underline decoration-blue-500 decoration-4 underline-offset-4">Hoạt động gần đây</h3>
                        <div className="space-y-6">
                            {[
                                { action: "Đăng nhập hệ thống", time: "2 giờ trước", type: "login" },
                                { action: "Xem hóa đơn tháng 02/2026", time: "1 ngày trước", type: "view" },
                                { action: "Cập nhật số điện thoại", time: "3 ngày trước", type: "update" }
                            ].map((activity, idx) => (
                                <div key={idx} className="flex gap-4 items-start">
                                    <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{activity.action}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
