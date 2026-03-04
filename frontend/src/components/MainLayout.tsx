import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { Bell, Menu, Search } from "lucide-react";
import { useAuthStore } from "../store/authStore";

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const { user } = useAuthStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-100">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div
                onClick={() => setIsSidebarOpen(false)}
                className={`fixed inset-0 z-20 bg-slate-900/40 transition-opacity lg:hidden ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                aria-hidden="true"
            />

            <div className="flex min-h-screen flex-col lg:pl-64">
                <header className="bg-white h-16 border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                            aria-label="Mở menu"
                        >
                            <Menu size={18} />
                        </button>

                        <div className="hidden sm:flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-full w-full max-w-md border border-slate-200">
                            <Search size={16} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className="bg-transparent border-none outline-none text-sm w-full text-slate-600 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <button className="sm:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                            <Search size={18} />
                        </button>
                        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
                        <div className="flex items-center gap-3">
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
