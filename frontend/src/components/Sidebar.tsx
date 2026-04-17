import { Link, useLocation } from "react-router";
import { useAuthStore } from "../store/authStore";
import { toast } from "sonner";
import { resolveBackendAssetUrl } from "../utils/url";
import {
    Home,
    DoorOpen,
    Receipt,
    FileText,
    User,
    Settings,
    LogOut,
    ChevronRight,
    Zap,
    Calendar,
    X,
    Users as UsersIcon,
    Wrench,
    Package,
    CircleDollarSign,
} from "lucide-react";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { user, logout } = useAuthStore();
    const location = useLocation();
    const isAdmin = user?.vaiTro === "Chu_Tro";

    const menuItems = [
        { icon: Home, label: "Trang chá»§", href: "/", roles: ["Chu_Tro", "Khach"] },
        { icon: DoorOpen, label: "Xem PhÃ²ng", href: "/rooms", roles: ["Chu_Tro", "Khach"] },
        { icon: Receipt, label: "HÃ³a Ä‘Æ¡n", href: "/invoices", roles: ["Chu_Tro", "Khach"] },
        { icon: Zap, label: "Äiá»‡n & NÆ°á»›c", href: "/utilities", roles: ["Chu_Tro", "Khach"] },
        { icon: Calendar, label: "Lá»‹ch xem phÃ²ng", href: "/bookings", roles: ["Chu_Tro", "Khach"] },
        { icon: FileText, label: "Há»£p Ä‘á»“ng", href: "/contracts", roles: ["Chu_Tro", "Khach"] },
        { icon: Wrench, label: "Báº£o trÃ¬", href: "/maintenance", roles: ["Chu_Tro", "Khach"] },
        { icon: User, label: "CÃ¡ nhÃ¢n", href: "/profile", roles: ["Chu_Tro", "Khach"] },
    ];

    const adminItems = [
        { icon: Settings, label: "Báº£ng quáº£n trá»‹", href: "/admin", roles: ["Chu_Tro"] },
        { icon: CircleDollarSign, label: "Thanh toán", href: "/payments", roles: ["Chu_Tro"] },
        { icon: DoorOpen, label: "PhÃ²ng Ä‘ang thuÃª", href: "/rented-rooms", roles: ["Chu_Tro"] },
        { icon: UsersIcon, label: "Quáº£n lÃ½ khÃ¡ch", href: "/customers", roles: ["Chu_Tro"] },
        { icon: Package, label: "Quáº£n lÃ½ váº­t tÆ°", href: "/assets", roles: ["Chu_Tro"] },
    ];

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-30 w-72 max-w-[85vw] bg-blue-900 text-white flex flex-col shadow-xl transform transition-transform duration-300 lg:w-64 ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        >
            <div className="p-4 sm:p-6 flex items-center justify-between gap-3 border-b border-blue-800">
                <div
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-900">
                            <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" />
                        </svg>
                    </div>
                    <span className="font-bold text-lg tracking-tight truncate">QL NhÃ  Trá»</span>
                </div>
                <button
                    onClick={onClose}
                    className="lg:hidden p-2 rounded-lg hover:bg-blue-800 transition-colors"
                    aria-label="ÄÃ³ng menu"
                >
                    <X size={18} />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                    <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest px-3 mb-2">Chá»©c nÄƒng</p>
                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.label}
                                to={item.href}
                                onClick={onClose}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors group ${location.pathname === item.href
                                    ? "bg-blue-700 text-white"
                                    : "text-blue-100 hover:bg-blue-800"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={18} />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </div>
                                {location.pathname === item.href && <ChevronRight size={14} />}
                            </Link>
                        ))}
                    </div>
                </div>

                {isAdmin && (
                    <div>
                        <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest px-3 mb-2">Quáº£n trá»‹</p>
                        <div className="space-y-1">
                            {adminItems.map((item) => (
                                <Link
                                    key={item.label}
                                    to={item.href}
                                    onClick={onClose}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors group ${location.pathname === item.href
                                        ? "bg-blue-700 text-white"
                                        : "text-blue-100 hover:bg-blue-800"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon size={18} />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </div>
                                    {location.pathname === item.href && <ChevronRight size={14} />}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </nav>

            <div className="p-4 border-t border-blue-800 bg-blue-950/30">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-sm font-bold uppercase shadow-inner border border-blue-600 overflow-hidden">
                        {user?.avatar ? (
                            <img 
                                src={resolveBackendAssetUrl(user.avatar)} 
                                alt="Avatar" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            user?.tenDangNhap?.charAt(0)
                        )}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate">{user?.tenDangNhap}</p>
                        <p className="text-[10px] text-blue-300 uppercase tracking-wider">
                            {isAdmin ? "Chá»§ trá»" : "KhÃ¡ch thuÃª"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        logout();
                        onClose();
                        toast.success("ÄÄƒng xuáº¥t thÃ nh cÃ´ng");
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-blue-800/50 hover:bg-red-600/20 hover:text-red-300 py-2 rounded-lg transition-all text-sm font-medium border border-blue-700/50 hover:border-red-500/30"
                >
                    <LogOut size={16} /> ÄÄƒng xuáº¥t
                </button>
            </div>
        </aside>
    );
}

