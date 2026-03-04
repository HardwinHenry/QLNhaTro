import { useEffect, useState } from "react";
import { FileText, Search, Loader2, Calendar, ShieldCheck, AlertCircle, Plus, X, Edit3, Trash2, StopCircle, RefreshCw, LayoutTemplate, Users, Package, Info, Zap, Droplets } from "lucide-react";
import { contractService, type Contract } from "../services/contractService";
import { roomService, type Room } from "../services/roomService";
import { utilityService } from "../services/utilityService";
import { getAllUsers } from "../services/authService";
import { useAuthStore } from "../store/authStore";
import { resolveBackendAssetUrl } from "../utils/url";

export default function ContractsPage() {
    const { user } = useAuthStore();
    const isAdmin = user?.vaiTro === "Chu_Tro";
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form state
    const [rooms, setRooms] = useState<Room[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedRoom, setSelectedRoom] = useState("");
    const [selectedUser, setSelectedUser] = useState("");
    const [ngayBatDau, setNgayBatDau] = useState(new Date().toISOString().slice(0, 10));
    const [ngayKetThuc, setNgayKetThuc] = useState("");
    const [giaThue, setGiaThue] = useState(0);
    const [tienCoc, setTienCoc] = useState(0);
    const [giaDien, setGiaDien] = useState(0);
    const [giaNuoc, setGiaNuoc] = useState(0);

    // Edit state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editGiaThue, setEditGiaThue] = useState(0);
    const [editTienCoc, setEditTienCoc] = useState(0);
    const [editGiaDien, setEditGiaDien] = useState(0);
    const [editGiaNuoc, setEditGiaNuoc] = useState(0);
    const [editNgayKetThuc, setEditNgayKetThuc] = useState("");

    // Details state
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Extend state
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [currentContract, setCurrentContract] = useState<Contract | null>(null);
    const [newEndDate, setNewEndDate] = useState("");

    const fetchContracts = async () => {
        try {
            const data = await contractService.getAllHopDongs();
            setContracts(data);
        } catch (error) {
            console.error("Lá»—i khi táº£i há»£p Ä‘á»“ng:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
        const fetchData = async () => {
            try {
                const latestGiaData = await utilityService.getLatestGia().catch(() => null);
                if (latestGiaData) {
                    setGiaDien(latestGiaData.giaDien);
                    setGiaNuoc(latestGiaData.giaNuoc);
                }

                if (isAdmin) {
                    const [roomsData, usersData] = await Promise.all([
                        roomService.getAllPhongs(),
                        getAllUsers().catch(() => [])
                    ]);
                    setRooms(roomsData.filter(r => r.trangThai === "Trong"));
                    setUsers(usersData.filter((u: any) => u.vaiTro === "Khach"));
                }
            } catch (error) {
                console.error("Lá»—i khi fetch data phá»¥ trá»£:", error);
            }
        };
        fetchData();
    }, [isAdmin]);

    const handleRoomChange = (idPhong: string) => {
        setSelectedRoom(idPhong);
        const room = rooms.find(r => r._id === idPhong);
        if (room) setGiaThue(room.giaPhong);
    };

    const handleCreateContract = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await contractService.createHopDong({
                idPhong: selectedRoom,
                idKhach: selectedUser,
                ngayBatDau,
                ngayKetThuc: ngayKetThuc || undefined,
                giaThue,
                tienCoc,
                giaDien,
                giaNuoc,
                trangThai: "Con_Hieu_Luc"
            });
            alert("Táº¡o há»£p Ä‘á»“ng thÃ nh cÃ´ng");
            setIsCreateModalOpen(false);
            fetchContracts();
        } catch (error) {
            alert("Lá»—i khi táº¡o há»£p Ä‘á»“ng");
        }
    };

    const handleDeleteContract = async (id: string) => {
        if (confirm("Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a há»£p Ä‘á»“ng nÃ y? Thao tÃ¡c nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c.")) {
            try {
                await contractService.deleteHopDong(id);
                alert("XÃ³a há»£p Ä‘á»“ng thÃ nh cÃ´ng");
                fetchContracts();
            } catch (error) {
                alert("Lá»—i khi xÃ³a há»£p Ä‘á»“ng");
            }
        }
    };

    const handleTerminateContract = async (id: string) => {
        if (confirm("Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n káº¿t thÃºc há»£p Ä‘á»“ng nÃ y? PhÃ²ng sáº½ Ä‘Æ°á»£c giáº£i phÃ³ng.")) {
            try {
                await contractService.updateHopDong(id, { trangThai: "Ket_Thuc" });
                alert("Káº¿t thÃºc há»£p Ä‘á»“ng thÃ nh cÃ´ng");
                fetchContracts();
            } catch (error) {
                alert("Lá»—i khi káº¿t thÃºc há»£p Ä‘á»“ng");
            }
        }
    };

    const handleUpdateContract = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentContract) return;
        try {
            await contractService.updateHopDong(currentContract._id, {
                giaThue: editGiaThue,
                tienCoc: editTienCoc,
                giaDien: editGiaDien,
                giaNuoc: editGiaNuoc,
                ngayKetThuc: editNgayKetThuc || undefined
            });
            alert("Cáº­p nháº­t há»£p Ä‘á»“ng thÃ nh cÃ´ng");
            setIsEditModalOpen(false);
            fetchContracts();
        } catch (error) {
            alert("Lá»—i khi cáº­p nháº­t há»£p Ä‘á»“ng");
        }
    };

    const handleExtendContract = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentContract || !newEndDate) return;
        try {
            await contractService.extendHopDong(currentContract._id, newEndDate);
            alert("Gia háº¡n há»£p Ä‘á»“ng thÃ nh cÃ´ng");
            setIsExtendModalOpen(false);
            fetchContracts();
        } catch (error) {
            alert("Lá»—i khi gia háº¡n há»£p Ä‘á»“ng");
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Con_Hieu_Luc":
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "Ket_Thuc":
                return "bg-slate-100 text-slate-600 border-slate-200";

            case "cho_ky":
                return "bg-amber-100 text-amber-700 border-amber-200";
            default:
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "Con_Hieu_Luc": return "Äang hiá»‡u lá»±c";
            case "Ket_Thuc": return "ÄÃ£ káº¿t thÃºc";

            case "cho_ky": return "Chá» kÃ½";
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Äang táº£i danh sÃ¡ch há»£p Ä‘á»“ng...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Há»£p Ä‘á»“ng</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Quáº£n lÃ½ cÃ¡c cam káº¿t thuÃª phÃ²ng</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {isAdmin && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-black transition-all shadow-lg"
                        >
                            <Plus size={18} />
                            Táº¡o há»£p Ä‘á»“ng
                        </button>
                    )}
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="TÃ¬m há»£p Ä‘á»“ng..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-full sm:w-64 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {contracts.length > 0 ? (
                    contracts.map((contract) => (
                        <div key={contract._id} className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-6 group hover:border-blue-300 transition-all shadow-sm">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <FileText size={32} />
                            </div>

                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-black text-slate-800 text-lg">Há»£p Ä‘á»“ng {contract.idPhong?.tenPhong || "PhÃ²ng"}</h3>

                                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getStatusStyle(contract.trangThai)}`}>
                                        {getStatusLabel(contract.trangThai)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-medium">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Calendar size={16} className="text-blue-500" />
                                        <span>{new Date(contract.ngayBatDau).toLocaleDateString("vi-VN")} - {contract.ngayKetThuc ? new Date(contract.ngayKetThuc).toLocaleDateString("vi-VN") : "KhÃ¡ch thuÃª linh hoáº¡t"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <ShieldCheck size={16} className="text-emerald-500" />
                                        <span>Tiá»n cá»c: <span className="font-bold text-slate-800">{contract.tienCoc.toLocaleString("vi-VN")}Ä‘</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <AlertCircle size={16} className="text-amber-500" />
                                        <span>GiÃ¡ thuÃª: <span className="font-bold text-blue-600">{contract.giaThue.toLocaleString("vi-VN")}Ä‘/thÃ¡ng</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                <button
                                    onClick={() => {
                                        setCurrentContract(contract);
                                        setIsDetailsModalOpen(true);
                                    }}
                                    className="flex-1 md:w-32 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-sm transition-all shadow-md shadow-blue-100"
                                >
                                    Xem chi tiáº¿t
                                </button>
                                {isAdmin && (
                                    <>
                                        {contract.trangThai === "Con_Hieu_Luc" && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setCurrentContract(contract);
                                                        setEditGiaThue(contract.giaThue);
                                                        setEditTienCoc(contract.tienCoc);
                                                        setEditGiaDien(contract.giaDien || giaDien);
                                                        setEditGiaNuoc(contract.giaNuoc || giaNuoc);
                                                        setEditNgayKetThuc(contract.ngayKetThuc || "");
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="flex items-center justify-center gap-2 flex-1 md:w-32 bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-900 hover:text-white font-bold py-2 rounded-xl text-sm transition-all"
                                                >
                                                    <Edit3 size={14} /> Cáº­p nháº­t
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCurrentContract(contract);
                                                        setNewEndDate(contract.ngayKetThuc || "");
                                                        setIsExtendModalOpen(true);
                                                    }}
                                                    className="flex items-center justify-center gap-2 flex-1 md:w-32 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white font-bold py-2 rounded-xl text-sm transition-all"
                                                >
                                                    <RefreshCw size={14} /> Gia háº¡n
                                                </button>
                                                <button
                                                    onClick={() => handleTerminateContract(contract._id)}
                                                    className="flex items-center justify-center gap-2 flex-1 md:w-32 bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-600 hover:text-white font-bold py-2 rounded-xl text-sm transition-all"
                                                >
                                                    <StopCircle size={14} /> Káº¿t thÃºc
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleDeleteContract(contract._id)}
                                            className="flex items-center justify-center gap-2 flex-1 md:w-32 bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white font-bold py-2 rounded-xl text-sm transition-all"
                                        >
                                            <Trash2 size={14} /> XÃ³a
                                        </button>
                                    </>
                                )}
                                <button className="flex-1 md:w-32 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-2 rounded-xl text-sm transition-all">
                                    Táº£i vá» (PDF)
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center bg-white border border-dashed border-slate-300 rounded-3xl">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-medium">Hiá»‡n táº¡i báº¡n chÆ°a cÃ³ há»£p Ä‘á»“ng nÃ o.</p>
                    </div>
                )}
            </div>

            {/* Create Contract Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-xl max-h-[90vh] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
                                <FileText size={24} className="text-blue-600" />
                                Táº¡o há»£p Ä‘á»“ng má»›i
                            </h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateContract} className="p-4 sm:p-8 space-y-5 sm:space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Chá»n phÃ²ng trá»‘ng</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={selectedRoom}
                                        onChange={(e) => handleRoomChange(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Chá»n phÃ²ng --</option>
                                        {rooms.map(room => (
                                            <option key={room._id} value={room._id}>{room.tenPhong}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Chá»n khÃ¡ch hÃ ng</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Chá»n khÃ¡ch --</option>
                                        {users.map(user => (
                                            <option key={user._id} value={user._id}>{user.hoVaTen} ({user.tenDangNhap})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">NgÃ y báº¯t Ä‘áº§u</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={ngayBatDau}
                                        onChange={(e) => setNgayBatDau(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">NgÃ y káº¿t thÃºc (khÃ´ng báº¯t buá»™c)</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={ngayKetThuc}
                                        onChange={(e) => setNgayKetThuc(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">GiÃ¡ thuÃª (vnÄ‘ / thÃ¡ng)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={giaThue}
                                        onChange={(e) => setGiaThue(Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tiá»n Ä‘áº·t cá»c (vnÄ‘)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={tienCoc}
                                        onChange={(e) => setTienCoc(Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">GiÃ¡ Ä‘iá»‡n (vnÄ‘ / kWh)</label>
                                    <div className="relative">
                                        <Zap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                            value={giaDien}
                                            onChange={(e) => setGiaDien(Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">GiÃ¡ nÆ°á»›c (vnÄ‘ / mÂ³)</label>
                                    <div className="relative">
                                        <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                            value={giaNuoc}
                                            onChange={(e) => setGiaNuoc(Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-3xl shadow-2xl transition-all shadow-slate-200 flex items-center justify-center gap-2">
                                <Plus size={18} />
                                KÃ½ vÃ  Táº¡o há»£p Ä‘á»“ng
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Edit Contract Modal */}
            {isEditModalOpen && currentContract && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-xl max-h-[90vh] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
                                <Edit3 size={24} className="text-blue-600" />
                                Cáº­p nháº­t há»£p Ä‘á»“ng
                            </h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateContract} className="p-4 sm:p-8 space-y-5 sm:space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <p className="text-sm text-slate-500 font-medium">Äang chá»‰nh sá»­a há»£p Ä‘á»“ng cho phÃ²ng <span className="text-slate-900 font-bold">{currentContract.idPhong?.tenPhong}</span>.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">GiÃ¡ thuÃª (vnÄ‘ / thÃ¡ng)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={editGiaThue}
                                        onChange={(e) => setEditGiaThue(Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tiá»n Ä‘áº·t cá»c (vnÄ‘)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={editTienCoc}
                                        onChange={(e) => setEditTienCoc(Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                                        GiÃ¡ Ä‘iá»‡n (vnÄ‘ / kWh)
                                        {giaDien > 0 && <span className="text-blue-500 font-bold">HT: {giaDien.toLocaleString()}Ä‘</span>}
                                    </label>
                                    <div className="relative">
                                        <Zap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                            value={editGiaDien}
                                            onChange={(e) => setEditGiaDien(Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                                        GiÃ¡ nÆ°á»›c (vnÄ‘ / mÂ³)
                                        {giaNuoc > 0 && <span className="text-blue-500 font-bold">HT: {giaNuoc.toLocaleString()}Ä‘</span>}
                                    </label>
                                    <div className="relative">
                                        <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                            value={editGiaNuoc}
                                            onChange={(e) => setEditGiaNuoc(Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">NgÃ y káº¿t thÃºc</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={editNgayKetThuc}
                                        onChange={(e) => setEditNgayKetThuc(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-3xl shadow-2xl transition-all shadow-slate-200 flex items-center justify-center gap-2">
                                <Edit3 size={18} />
                                LÆ°u thay Ä‘á»•i
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Extend Contract Modal */}
            {isExtendModalOpen && currentContract && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
                        <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
                                <RefreshCw size={24} className="text-emerald-600" />
                                Gia háº¡n há»£p Ä‘á»“ng
                            </h2>
                            <button onClick={() => setIsExtendModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleExtendContract} className="p-4 sm:p-8 space-y-5 sm:space-y-6 overflow-y-auto">
                            <div>
                                <p className="text-sm text-slate-500 mb-4 font-medium">Báº¡n Ä‘ang thá»±c hiá»‡n gia háº¡n há»£p Ä‘á»“ng cho phÃ²ng <span className="text-slate-900 font-bold">{currentContract.idPhong?.tenPhong}</span>.</p>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">NgÃ y káº¿t thÃºc má»›i</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 outline-none transition-all"
                                    value={newEndDate}
                                    onChange={(e) => setNewEndDate(e.target.value)}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-3xl shadow-2xl transition-all shadow-emerald-100 flex items-center justify-center gap-2">
                                <RefreshCw size={18} />
                                XÃ¡c nháº­n gia háº¡n
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Details Contract Modal */}
            {isDetailsModalOpen && currentContract && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Chi tiáº¿t há»£p Ä‘á»“ng</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">MÃ£ HÄ: {currentContract._id.slice(-8).toUpperCase()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="p-3 hover:bg-slate-200 rounded-2xl transition-all border border-transparent hover:border-slate-300 text-slate-400"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 sm:p-8 lg:p-10 space-y-8 sm:space-y-12 overflow-y-auto custom-scrollbar flex-1">
                            {/* Top Grid: Room Image & Status */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 space-y-6">
                                    {currentContract.idPhong?.hinhAnh && (
                                        <div className="rounded-[2.5rem] overflow-hidden aspect-[16/9] w-full group relative shadow-2xl border-4 border-white">
                                            <img
                                                src={resolveBackendAssetUrl(Array.isArray(currentContract.idPhong?.hinhAnh) ? currentContract.idPhong.hinhAnh[0] : currentContract.idPhong?.hinhAnh)}
                                                alt={currentContract.idPhong?.tenPhong}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "/Phong01.jpg";
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                            <div className="absolute bottom-6 left-8">
                                                <h3 className="text-white font-black text-3xl mb-1">{currentContract.idPhong?.tenPhong}</h3>
                                                <div className="flex items-center gap-2 text-white/90">
                                                    <LayoutTemplate size={16} />
                                                    <span className="font-bold text-sm tracking-wide">DÃ£y {currentContract.idPhong?.idDayPhong?.soDay} - {currentContract.idPhong?.idDayPhong?.tenDay}</span>
                                                </div>
                                            </div>
                                            <div className="absolute top-6 right-6">
                                                <span className={`px-4 py-2 rounded-2xl text-xs font-black border shadow-xl ${getStatusStyle(currentContract.trangThai)}`}>
                                                    {getStatusLabel(currentContract.trangThai).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-6 shadow-xl shadow-slate-200">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">ThÃ´ng tin thanh toÃ¡n</h4>
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-white/50 text-xs font-bold uppercase mb-1">GiÃ¡ thuÃª hÃ ng thÃ¡ng</p>
                                                <p className="text-3xl font-black text-blue-400">{currentContract.giaThue.toLocaleString("vi-VN")}<span className="text-xs ml-1 opacity-60">Ä‘/thÃ¡ng</span></p>
                                            </div>
                                            <div>
                                                <p className="text-white/50 text-xs font-bold uppercase mb-1">Tiá»n Ä‘áº·t cá»c</p>
                                                <p className="text-2xl font-black text-emerald-400">{currentContract.tienCoc.toLocaleString("vi-VN")}<span className="text-xs ml-1 opacity-60">Ä‘</span></p>
                                            </div>
                                            <div className="pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-white/50 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Zap size={10} /> Äiá»‡n</p>
                                                    <p className="font-black text-amber-400">
                                                        {(currentContract.giaDien || giaDien || 0).toLocaleString("vi-VN")}
                                                        <span className="text-[10px] ml-1 opacity-60 italic font-medium tracking-normal text-white/40">
                                                            {!currentContract.giaDien ? "(HT)" : "Ä‘"}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-white/50 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Droplets size={10} /> NÆ°á»›c</p>
                                                    <p className="font-black text-blue-300">
                                                        {(currentContract.giaNuoc || giaNuoc || 0).toLocaleString("vi-VN")}
                                                        <span className="text-[10px] ml-1 opacity-60 italic font-medium tracking-normal text-white/40">
                                                            {!currentContract.giaNuoc ? "(HT)" : "Ä‘"}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 space-y-4">
                                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Thá»i háº¡n thuÃª</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 text-xs font-bold">Báº¯t Ä‘áº§u:</span>
                                                <span className="text-sm font-black text-slate-800">{new Date(currentContract.ngayBatDau).toLocaleDateString("vi-VN")}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 text-xs font-bold">Káº¿t thÃºc:</span>
                                                <span className="text-sm font-black text-slate-800">{currentContract.ngayKetThuc ? new Date(currentContract.ngayKetThuc).toLocaleDateString("vi-VN") : "Linh hoáº¡t"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid: Room Detail & Customer Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                            <LayoutTemplate size={16} />
                                        </div>
                                        Chi tiáº¿t khÃ´ng gian
                                    </h3>
                                    <div className="bg-slate-50 p-8 rounded-[2rem] space-y-4 border border-slate-100">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-slate-500 text-sm font-medium">Diá»‡n tÃ­ch:</span>
                                            <span className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">{currentContract.idPhong?.dienTich} mÂ²</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-slate-500 text-sm font-medium">Sá»©c chá»©a tá»‘i Ä‘a:</span>
                                            <span className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">{currentContract.idPhong?.sucChua} ngÆ°á»i</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-slate-500 text-sm font-medium">Loáº¡i phÃ²ng:</span>
                                            <span className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">{currentContract.idPhong?.loaiPhong?.replace("_", " ") || "PhÃ²ng thÆ°á»ng"}</span>
                                        </div>

                                        {currentContract.idPhong?.vatTu && currentContract.idPhong?.vatTu.length > 0 && (
                                            <div className="pt-6 border-t border-slate-200 mt-4 space-y-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiá»‡n nghi cÃ³ sáºµn</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {currentContract.idPhong?.vatTu.map((item: any) => (
                                                        <span key={item._id} className="px-3 py-1.5 bg-white text-slate-600 rounded-xl text-[10px] font-black border border-slate-200 flex items-center gap-2 shadow-sm">
                                                            <Package size={12} className="text-blue-500" /> {item.tenVatTu}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                        <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                                            <Users size={16} />
                                        </div>
                                        ThÃ´ng tin ngÆ°á»i thuÃª
                                    </h3>
                                    <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6 border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-xl font-black text-purple-600 shadow-sm border border-slate-200">
                                                {currentContract.idKhach?.hoVaTen?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-lg leading-tight">{currentContract.idKhach?.hoVaTen}</p>
                                                <p className="text-xs text-slate-400 font-bold font-mono tracking-tighter">@{currentContract.idKhach?.tenDangNhap}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <div className="flex justify-between items-center group">
                                                <span className="text-slate-500 text-sm font-medium">Sá»‘ Ä‘iá»‡n thoáº¡i:</span>
                                                <span className="font-black text-slate-800">{currentContract.idKhach?.soDienThoai || "ChÆ°a cáº­p nháº­t"}</span>
                                            </div>
                                            <div className="flex justify-between items-center group">
                                                <span className="text-slate-500 text-sm font-medium">CCCD / CMND:</span>
                                                <span className="font-black text-slate-800">{currentContract.idKhach?.cccd || "N/A"}</span>
                                            </div>
                                            {currentContract.idKhach?.email && (
                                                <div className="flex justify-between items-center group">
                                                    <span className="text-slate-500 text-sm font-medium">Email liÃªn há»‡:</span>
                                                    <span className="font-black text-slate-800">{currentContract.idKhach?.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Extra Information / Notes */}
                                {(currentContract.idPhong?.moTa || currentContract.ghiChu) && (
                                    <div className="md:col-span-2 space-y-6">
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                                            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                                                <Info size={16} />
                                            </div>
                                            Ghi chÃº & Äiá»u khoáº£n bá»• sung
                                        </h3>
                                        <div className="bg-amber-50/30 p-5 sm:p-8 rounded-[2rem] space-y-4 border border-amber-100 flex flex-col sm:flex-row gap-4">
                                            <AlertCircle className="text-amber-500 shrink-0 mt-1" size={20} />
                                            <p className="text-slate-600 leading-relaxed font-medium italic">
                                                "{currentContract.idPhong?.moTa || currentContract.ghiChu || "CÃ¡c quy Ä‘á»‹nh chung cá»§a nhÃ  trá» Ä‘Æ°á»£c Ã¡p dá»¥ng cho há»£p Ä‘á»“ng nÃ y. Vui lÃ²ng tuÃ¢n thá»§ quy táº¯c vá» giá» giáº¥c vÃ  vá»‡ sinh chung."}"
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-4 sm:p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="flex-1 bg-slate-900 hover:bg-black text-white font-black py-4 rounded-3xl shadow-xl transition-all active:scale-95"
                            >
                                ÄÃ³ng chi tiáº¿t
                            </button>
                            <button className="px-10 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-bold py-4 rounded-3xl transition-all shadow-sm active:scale-95 flex items-center gap-2">
                                <FileText size={18} /> Xuáº¥t PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}




