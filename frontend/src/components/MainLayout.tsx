import React, { useState } from "react";
import { useNavigate } from "react-router";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";
import { useAuthStore } from "../store/authStore";

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const { user } = useAuthStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-100">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div
                onClick={() => setIsSidebarOpen(false)}
                className={`fixed inset-0 z-20 bg-slate-900/40 transition-opacity lg:hidden ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                aria-hidden="true"
            />

            <div className="flex min-h-screen flex-col lg:pl-64">
                <header className="bg-white h-16 border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                            aria-label="Mở menu"
                        >
                            <Menu size={18} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <div
                            onClick={() => navigate("/profile")}
                            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-2xl transition-all border border-transparent hover:border-slate-100"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-slate-800">{user?.tenDangNhap}</p>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                                    {user?.vaiTro === "Chu_Tro" ? "Chủ trọ" : "Khách thuê"}
                                </p>
                            </div>
                            <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm border border-blue-200 shadow-sm">
                                {user?.tenDangNhap?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

                <footer className="footer-bg border-t border-slate-200 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
                    © 2025 QL Nhà Trọ - Hệ thống quản lý nhà trọ hiện đại và chuyên nghiệp
                </footer>
            </div>
        </div>
    );
}
