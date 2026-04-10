import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { User, Phone, IdCard, Shield, Edit3, Camera, Save, X, Loader2, Home, Key, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { updateMe, getMe, changePassword } from "../services/authService";
import { toast } from "sonner";

export default function ProfilePage() {
    const { user, updateUser } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({
        hoVaTen: "",
        sdt: "",
        cccd: ""
    });
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const fullUser = await getMe();
                updateUser(fullUser);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu người dùng:", error);
            } finally {
                setFetching(false);
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        if (user) {
            setFormData({
                hoVaTen: user.hoVaTen || "",
                sdt: user.sdt || "",
                cccd: user.cccd || ""
            });
        }
    }, [user, isEditing]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const updatedUser = await updateMe(formData);
            updateUser(updatedUser);
            toast.success("Cập nhật hồ sơ thành công!");
            setIsEditing(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật hồ sơ");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return toast.error("Mật khẩu xác nhận không khớp");
        }
        if (passwordData.newPassword.length < 6) {
            return toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
        }

        setPasswordLoading(true);
        try {
            await changePassword(passwordData.currentPassword, passwordData.newPassword);
            toast.success("Đổi mật khẩu thành công!");
            setIsPasswordModalOpen(false);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi đổi mật khẩu");
        } finally {
            setPasswordLoading(false);
        }
    };

    const infoItems = [
        { icon: User, label: "Tên đăng nhập", value: user?.tenDangNhap, nonEditable: true },
        { icon: User, label: "Họ và tên", value: user?.hoVaTen || "Chưa cập nhật", key: "hoVaTen" },
        { icon: Phone, label: "Số điện thoại", value: user?.sdt || "Chưa cập nhật", key: "sdt" },
        { icon: IdCard, label: "Số CCCD", value: user?.cccd || "Chưa cập nhật", key: "cccd" },
        { icon: Shield, label: "Vai trò", value: user?.vaiTro === "Chu_Tro" ? "Chủ trọ" : "Khách thuê", nonEditable: true },
    ];

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Trang cá nhân</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Quản lý và cập nhật thông tin tài khoản của bạn</p>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-xl shadow-blue-200 active:scale-95"
                    >
                        <Edit3 size={18} />
                        Chỉnh sửa hồ sơ
                    </button>
                ) : (
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black transition-all active:scale-95"
                        >
                            <X size={18} />
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-black transition-all shadow-xl active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Lưu thông tin
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col items-center text-center shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-24 bg-blue-600/5 group-hover:h-28 transition-all duration-500"></div>
                        <div className="relative z-10 group mt-4">
                            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-blue-600 text-4xl font-black border-4 border-white shadow-2xl group-hover:bg-blue-50 transition-colors">
                                {user?.tenDangNhap?.charAt(0).toUpperCase()}
                            </div>
                            <button className="absolute bottom-1 right-1 p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg border-4 border-white hover:scale-110 transition-transform">
                                <Camera size={16} />
                            </button>
                        </div>
                        <h2 className="mt-8 font-black text-2xl text-slate-800 relative z-10">{user?.hoVaTen || user?.tenDangNhap}</h2>
                        <span className="mt-3 px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100 uppercase tracking-[0.2em] relative z-10">
                            {user?.vaiTro === "Chu_Tro" ? "Chủ nhà trọ" : "Khách thuê phòng"}
                        </span>

                        <div className="w-full mt-10 pt-10 border-t border-slate-100 flex justify-around text-sm relative z-10">
                            <div className="text-center">
                                <p className="font-black text-slate-800 text-lg">1+</p>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Năm tham gia</p>
                            </div>
                            <div className="w-px h-10 bg-slate-100"></div>
                            <div className="text-center">
                                <p className="font-black text-slate-800 text-lg">Trusted</p>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Trạng thái</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
                        <h3 className="font-black text-lg mb-4 flex items-center gap-3 relative z-10">
                            <Shield size={20} className="text-blue-400" />
                            Bảo mật & Quyền lợi
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8 font-medium relative z-10">
                            Thông tin của bạn được mã hóa an toàn. Hãy đảm bảo CCCD và Số điện thoại chính xác để được hỗ trợ tốt nhất.
                        </p>
                        <button
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/10 relative z-10"
                        >
                            Đổi mật khẩu bảo mật
                        </button>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="font-black text-slate-800">Thông tin cơ bản</h3>
                            {isEditing && <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">Đang chỉnh sửa</span>}
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                {infoItems.map((item, idx) => (
                                    <div key={idx} className="space-y-3 group">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <item.icon size={16} className="group-hover:text-blue-600 transition-colors" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                                        </div>

                                        {isEditing && !item.nonEditable ? (
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
                                                value={formData[item.key as keyof typeof formData]}
                                                onChange={(e) => setFormData({ ...formData, [item.key as string]: e.target.value })}
                                                placeholder={`Nhập ${item.label.toLowerCase()}...`}
                                            />
                                        ) : (
                                            <p className={`font-black text-lg pl-6 ${item.value === "Chưa cập nhật" ? "text-slate-300 italic font-medium" : "text-slate-700"}`}>
                                                {item.value}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {user?.vaiTro === "Khach" && (
                        <div className="bg-blue-600 rounded-[2.5rem] shadow-xl p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 text-white overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                                <Home size={24} className="text-white" />
                            </div>
                            <div className="flex-1 relative z-10">
                                <h4 className="font-black mb-1 leading-none uppercase text-xs tracking-[0.2em] opacity-80">Phòng đang thuê</h4>
                                {user?.phongHienTai ? (
                                    <div className="mt-2">
                                        <p className="text-2xl font-black">{user.phongHienTai.tenPhong}</p>
                                        <p className="text-blue-100 text-xs font-bold mt-1 opacity-90 italic">
                                            Diện tích: {user.phongHienTai.dienTich}m² • Loại: {user.phongHienTai.loaiPhong?.replace("_", " ")}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-lg font-black mt-1 italic text-blue-100">Bạn hiện chưa thuê phòng nào.</p>
                                )}
                            </div>
                            {user?.phongHienTai && (
                                <div className="self-end sm:self-center">
                                    <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/30">
                                        Active
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Change Password Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="bg-slate-900 p-8 text-white relative">
                            <button
                                onClick={() => setIsPasswordModalOpen(false)}
                                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
                                <Key size={24} />
                            </div>
                            <h3 className="text-xl font-black">Thay đổi mật khẩu</h3>
                            <p className="text-slate-400 text-sm mt-1">Đảm bảo mật khẩu mới đủ mạnh để bảo vệ tài khoản</p>
                        </div>

                        <form onSubmit={handleChangePassword} className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Mật khẩu hiện tại</label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        required
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-bold pr-12"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Mật khẩu mới</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        required
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-bold pr-12"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Xác nhận mật khẩu mới</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-bold pr-12"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {passwordLoading ? <Loader2 className="animate-spin" size={18} /> : <span>Cập nhật mật khẩu</span>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

