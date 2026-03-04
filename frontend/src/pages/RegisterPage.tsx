import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router";
import { register as registerUser } from "../services/authService";
import { toast } from "sonner";
import { UserPlus, User, Lock, Phone, CreditCard, Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const registerSchema = z.object({
    hoVaTen: z.string().min(2, "Há» vÃ  tÃªn pháº£i cÃ³ Ã­t nháº¥t 2 kÃ½ tá»±"),
    tenDangNhap: z.string().min(3, "TÃªn Ä‘Äƒng nháº­p pháº£i cÃ³ Ã­t nháº¥t 3 kÃ½ tá»±"),
    matKhau: z.string()
        .min(6, "Máº­t kháº©u pháº£i cÃ³ Ã­t nháº¥t 6 kÃ½ tá»±")
        .regex(/[A-Z]/, "Máº­t kháº©u pháº£i cÃ³ Ã­t nháº¥t 1 chá»¯ cÃ¡i in hoa")
        .regex(/[0-9]/, "Máº­t kháº©u pháº£i cÃ³ Ã­t nháº¥t 1 chá»¯ sá»‘")
        .regex(/[^A-Za-z0-9]/, "Máº­t kháº©u pháº£i cÃ³ Ã­t nháº¥t 1 kÃ½ tá»± Ä‘áº·c biá»‡t"),
    sdt: z.string().min(10, "Sá»‘ Ä‘iá»‡n thoáº¡i khÃ´ng há»£p lá»‡"),
    cccd: z.string().min(9, "CCCD khÃ´ng há»£p lá»‡"),
    vaiTro: z.enum(["Chu_Tro", "Khach"]),
});


type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
            await registerUser(data);
            toast.success("ÄÄƒng kÃ½ thÃ nh cÃ´ng! Vui lÃ²ng Ä‘Äƒng nháº­p.");
            navigate("/login");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "ÄÄƒng kÃ½ tháº¥t báº¡i");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-100">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-2/5 bg-blue-900 flex-col justify-between p-10">
                <div>
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-9 h-9 bg-white rounded flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-900 fill-current">
                                <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" />
                            </svg>
                        </div>
                        <span className="text-white font-bold text-lg tracking-wide">QL NhÃ  Trá»</span>
                    </div>
                    <h2 className="text-white text-3xl font-bold leading-snug mb-4">
                        Táº¡o tÃ i khoáº£n<br />trong vÃ i giÃ¢y
                    </h2>
                    <p className="text-blue-200 text-sm leading-relaxed">
                        ÄÄƒng kÃ½ Ä‘á»ƒ báº¯t Ä‘áº§u quáº£n lÃ½ phÃ²ng trá», theo dÃµi há»£p Ä‘á»“ng vÃ  hoÃ¡ Ä‘Æ¡n ngay hÃ´m nay.
                    </p>
                </div>
                <div className="border-t border-blue-800 pt-6">
                    <p className="text-blue-300 text-xs">Â© 2025 QL NhÃ  Trá». Báº£o lÆ°u má»i quyá»n.</p>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-blue-900 rounded flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                                <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" />
                            </svg>
                        </div>
                        <span className="font-bold text-blue-900 text-lg">QL NhÃ  Trá»</span>
                    </div>

                    <h1 className="text-2xl font-bold text-slate-800 mb-1">Táº¡o tÃ i khoáº£n</h1>
                    <p className="text-slate-500 text-sm mb-7">Äiá»n Ä‘áº§y Ä‘á»§ thÃ´ng tin Ä‘á»ƒ hoÃ n táº¥t Ä‘Äƒng kÃ½</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Há» vÃ  tÃªn
                            </label>
                            <div className="relative">
                                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    {...register("hoVaTen")}
                                    className="w-full border border-slate-300 rounded bg-white pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                                    placeholder="Nháº­p há» vÃ  tÃªn"
                                />
                            </div>
                            {errors.hoVaTen && (
                                <p className="text-red-500 text-xs mt-1">{errors.hoVaTen.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                TÃªn Ä‘Äƒng nháº­p
                            </label>
                            <div className="relative">
                                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    {...register("tenDangNhap")}
                                    className="w-full border border-slate-300 rounded bg-white pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                                    placeholder="Nháº­p tÃªn Ä‘Äƒng nháº­p"
                                />
                            </div>
                            {errors.tenDangNhap && (
                                <p className="text-red-500 text-xs mt-1">{errors.tenDangNhap.message}</p>
                            )}
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Máº­t kháº©u
                            </label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    {...register("matKhau")}
                                    className="w-full border border-slate-300 rounded bg-white pl-9 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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
                                <p className="text-red-500 text-xs mt-1">{errors.matKhau.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Sá»‘ Ä‘iá»‡n thoáº¡i
                                </label>
                                <div className="relative">
                                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        {...register("sdt")}
                                        className="w-full border border-slate-300 rounded bg-white pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                                        placeholder="09xx..."
                                    />
                                </div>
                                {errors.sdt && (
                                    <p className="text-red-500 text-xs mt-1">{errors.sdt.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    CCCD
                                </label>
                                <div className="relative">
                                    <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        {...register("cccd")}
                                        className="w-full border border-slate-300 rounded bg-white pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                                        placeholder="123..."
                                    />
                                </div>
                                {errors.cccd && (
                                    <p className="text-red-500 text-xs mt-1">{errors.cccd.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Báº¡n lÃ ?
                            </label>
                            <select
                                {...register("vaiTro")}
                                className="w-full border border-slate-300 rounded bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                            >
                                <option value="Khach">NgÆ°á»i Ä‘i thuÃª (KhÃ¡ch)</option>
                                <option value="Chu_Tro">Chá»§ nhÃ  trá»</option>
                            </select>
                            {errors.vaiTro && (
                                <p className="text-red-500 text-xs mt-1">{errors.vaiTro.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded text-sm transition-colors flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <>
                                    <UserPlus size={16} /> Táº¡o tÃ i khoáº£n
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-sm mt-6">
                        ÄÃ£ cÃ³ tÃ i khoáº£n?{" "}
                        <Link to="/login" className="text-blue-700 hover:text-blue-800 font-medium">
                            ÄÄƒng nháº­p
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
