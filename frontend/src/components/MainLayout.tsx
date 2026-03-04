import React from "react";
import Sidebar from "./Sidebar";
import { Bell, Search } from "lucide-react";
import { useAuthStore } from "../store/authStore";

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const { user } = useAuthStore();

    return (
        <div className="min-h-screen bg-slate-100 flex">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                <header className="bg-white h-16 border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-full w-96 border border-slate-200">
                        <Search size={16} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            className="bg-transparent border-none outline-none text-sm w-full text-slate-600 placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-8 w-px bg-slate-200 mx-1"></div>
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
                <main className="flex-1 p-8">
                    {children}
                </main>
                <footer className="footer-bg border-t border-slate-200 py-4 px-8 text-center text-xs text-slate-400">
                    © 2025 QL Nhà Trọ — Hệ thống quản lý nhà trọ hiện đại & chuyên nghiệp
                </footer>
            </div>
        </div>
    );
}
