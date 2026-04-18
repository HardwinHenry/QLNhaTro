import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router";
import { register as registerUser } from "../services/authService";
import { toast } from "sonner";
import { UserPlus, User, Lock, Phone, CreditCard, Loader2, Eye, EyeOff, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";

const registerSchema = z.object({
    hoVaTen: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
    tenDangNhap: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
    matKhau: z.string()
        .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
        .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ cái in hoa")
        .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số")
        .regex(/[^A-Za-z0-9]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),
    matKhauXacNhan: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
    sdt: z.string().min(10, "Số điện thoại không hợp lệ"),
    cccd: z.string().min(9, "CCCD không hợp lệ"),
}).refine((data) => data.matKhau === data.matKhauXacNhan, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["matKhauXacNhan"],
});


type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [vaiTro, setVaiTro] = useState<"Khach" | "Chu_Tro">("Khach");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormValues) => {
        setLoading(true);
        try {
            await registerUser({ ...data, vaiTro });
            toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
            navigate("/login");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Đăng ký thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-100">
            {/* Left panel */}
            <div className={`hidden lg:flex lg:w-2/5 flex-col justify-between p-10 transition-colors duration-500 ${vaiTro === 'Chu_Tro' ? 'bg-indigo-900' : 'bg-blue-900'}`}>
                <div>
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-9 h-9 bg-white rounded flex items-center justify-center shadow-lg">
                            <svg viewBox="0 0 24 24" className={`w-5 h-5 fill-current ${vaiTro === 'Chu_Tro' ? 'text-indigo-900' : 'text-blue-900'}`}>
                                <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" />
                            </svg>
                        </div>
                        <span className="text-white font-bold text-lg tracking-wide uppercase">QL Nhà Trọ</span>
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-white text-4xl font-extrabold leading-tight mb-4">
                            {vaiTro === 'Chu_Tro' ? (
                                <>Gia nhập cộng đồng<br />chủ trọ hiện đại</>
                            ) : (
                                <>Tìm và quản lý<br />phòng trọ dễ dàng</>
                            )}
                        </h2>
                        <p className="text-blue-100 text-lg leading-relaxed max-w-md">
                            {vaiTro === 'Chu_Tro' ? 
                                "Công cụ quản lý chuyên nghiệp giúp bạn tối ưu hóa doanh thu và tiết kiệm thời gian quản lý vận hành." : 
                                "Đăng ký để bắt đầu theo dõi hợp đồng, thanh toán hóa đơn và quản lý tiện ích phòng trọ ngay hôm nay."
                            }
                        </p>
                        
                        <div className="pt-8 grid grid-cols-1 gap-4">
                            <div className="flex items-center gap-3 text-blue-100 text-sm">
                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">✓</div>
                                <span>Thao tác nhanh chóng, đơn giản</span>
                            </div>
                            <div className="flex items-center gap-3 text-blue-100 text-sm">
                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">✓</div>
                                <span>Bảo mật thông tin tuyệt đối</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-white/10 pt-6">
                    <p className="text-blue-300 text-xs">© 2025 QL Nhà Trọ. Nền tảng quản lý nhà trọ hàng đầu.</p>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${vaiTro === 'Chu_Tro' ? 'bg-indigo-900' : 'bg-blue-900'}`}>
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                                <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" />
                            </svg>
                        </div>
                        <span className={`font-bold text-lg ${vaiTro === 'Chu_Tro' ? 'text-indigo-900' : 'text-blue-900'}`}>QL Nhà Trọ</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Tạo tài khoản</h1>
                        <p className="text-slate-500 text-sm">Chọn loại tài khoản và điền đầy đủ thông tin</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-200/80 rounded-xl mb-8">
                        <button
                            type="button"
                            onClick={() => setVaiTro("Khach")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                vaiTro === "Khach"
                                    ? "bg-white text-blue-700 shadow-sm shadow-blue-100"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <Users size={16} />
                            Người thuê trọ
                        </button>
                        <button
                            type="button"
                            onClick={() => setVaiTro("Chu_Tro")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                vaiTro === "Chu_Tro"
                                    ? "bg-white text-indigo-700 shadow-sm shadow-indigo-100"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            <ShieldCheck size={16} />
                            Chủ trọ / Quản lý
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Họ và tên
                            </label>
                            <div className="relative group">
                                <User size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.hoVaTen ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-600'}`} />
                                <input
                                    {...register("hoVaTen")}
                                    className={`w-full border rounded-xl bg-white pl-9 pr-3 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                        errors.hoVaTen 
                                        ? 'border-red-300 focus:ring-red-100' 
                                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                                    }`}
                                    placeholder="Nhập đầy đủ tên của bạn"
                                />
                            </div>
                            {errors.hoVaTen && (
                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.hoVaTen.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Tên đăng nhập
                            </label>
                            <div className="relative group">
                                <User size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.tenDangNhap ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-600'}`} />
                                <input
                                    {...register("tenDangNhap")}
                                    className={`w-full border rounded-xl bg-white pl-9 pr-3 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                        errors.tenDangNhap 
                                        ? 'border-red-300 focus:ring-red-100' 
                                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                                    }`}
                                    placeholder="Ví dụ: nguyenvana"
                                />
                            </div>
                            {errors.tenDangNhap && (
                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.tenDangNhap.message}</p>
                            )}
                        </div>


                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Mật khẩu
                                </label>
                                <div className="relative group">
                                    <Lock size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.matKhau ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-600'}`} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        {...register("matKhau")}
                                        className={`w-full border rounded-xl bg-white pl-9 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                            errors.matKhau 
                                            ? 'border-red-300 focus:ring-red-100' 
                                            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                                        }`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.matKhau && (
                                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.matKhau.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Xác nhận
                                </label>
                                <div className="relative group">
                                    <Lock size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.matKhauXacNhan ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-600'}`} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        {...register("matKhauXacNhan")}
                                        className={`w-full border rounded-xl bg-white pl-9 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                            errors.matKhauXacNhan 
                                            ? 'border-red-300 focus:ring-red-100' 
                                            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                                        }`}
                                        placeholder="••••••••"
                                    />
                                </div>
                                {errors.matKhauXacNhan && (
                                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.matKhauXacNhan.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Số điện thoại
                                </label>
                                <div className="relative group">
                                    <Phone size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.sdt ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-600'}`} />
                                    <input
                                        {...register("sdt")}
                                        className={`w-full border rounded-xl bg-white pl-9 pr-3 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                            errors.sdt 
                                            ? 'border-red-300 focus:ring-red-100' 
                                            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                                        }`}
                                        placeholder="09xx..."
                                    />
                                </div>
                                {errors.sdt && (
                                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.sdt.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    CCCD / Định danh
                                </label>
                                <div className="relative group">
                                    <CreditCard size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.cccd ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-600'}`} />
                                    <input
                                        {...register("cccd")}
                                        className={`w-full border rounded-xl bg-white pl-9 pr-3 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                            errors.cccd 
                                            ? 'border-red-300 focus:ring-red-100' 
                                            : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                                        }`}
                                        placeholder="12 số CCCD"
                                    />
                                </div>
                                {errors.cccd && (
                                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.cccd.message}</p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white font-bold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 mt-4 shadow-lg active:scale-[0.98] ${
                                vaiTro === 'Chu_Tro' 
                                ? 'bg-indigo-700 hover:bg-indigo-800 shadow-indigo-100' 
                                : 'bg-blue-700 hover:bg-blue-800 shadow-blue-100'
                            }`}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <UserPlus size={18} /> Tạo tài khoản {vaiTro === 'Chu_Tro' ? 'Chủ trọ' : 'Thành viên'}
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-sm mt-8 pb-4">
                        Đã có tài khoản?{" "}
                        <Link to="/login" className={`font-semibold hover:underline ${vaiTro === 'Chu_Tro' ? 'text-indigo-700' : 'text-blue-700'}`}>
                            Đăng nhập ngay
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
