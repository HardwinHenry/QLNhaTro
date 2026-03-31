import { useEffect, useState } from "react";
import { FileText, Search, Loader2, Calendar, ShieldCheck, AlertCircle, Plus, X, Edit3, Trash2, StopCircle, RefreshCw, LayoutTemplate, Users, Package, Info, Zap, Droplets } from "lucide-react";
import { contractService, type Contract } from "../services/contractService";
import { roomService, type Room } from "../services/roomService";
import { utilityService } from "../services/utilityService";
import { getAllUsers } from "../services/authService";
import { useAuthStore } from "../store/authStore";
import { resolveBackendAssetUrl } from "../utils/url";
import { formatVi } from "../utils/dateFormatter";
import Swal from "sweetalert2";

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
    const [searchTerm, setSearchTerm] = useState("");
    const [roomSearchTerm, setRoomSearchTerm] = useState("");
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
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
            console.error("Lỗi khi tải hợp đồng:", error);
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
                console.error("Lỗi khi fetch data phụ trợ:", error);
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
            Swal.fire({ icon: 'success', title: 'Thành công!', text: 'Tạo hợp đồng thành công', confirmButtonColor: '#2563eb' });
            setIsCreateModalOpen(false);
            setSearchTerm("");
            setRooms(prev => prev.filter(r => r._id !== selectedRoom));
            fetchContracts();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Thất bại!', text: 'Lỗi khi tạo hợp đồng', confirmButtonColor: '#2563eb' });
        }
    };

    const handleDeleteContract = async (id: string) => {
        const result = await Swal.fire({
            title: 'Bạn có chắc chắn?',
            text: 'Bạn có chắc chắn muốn xóa hợp đồng này? Thao tác này không thể hoàn tác.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Đồng ý xóa',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                await contractService.deleteHopDong(id);
                Swal.fire({ icon: 'success', title: 'Đã xóa!', text: 'Xóa hợp đồng thành công', confirmButtonColor: '#2563eb' });
                fetchContracts();
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Thất bại!', text: 'Lỗi khi xóa hợp đồng', confirmButtonColor: '#2563eb' });
            }
        }
    };

    const handleTerminateContract = async (id: string) => {
        const result = await Swal.fire({
            title: 'Kết thúc hợp đồng?',
            text: 'Bạn có chắc chắn muốn kết thúc hợp đồng này? Phòng sẽ được giải phóng.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Kết thúc',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                await contractService.updateHopDong(id, { trangThai: "Ket_Thuc" });
                Swal.fire({ icon: 'success', title: 'Thành công!', text: 'Kết thúc hợp đồng thành công', confirmButtonColor: '#2563eb' });
                fetchContracts();
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Thất bại!', text: 'Lỗi khi kết thúc hợp đồng', confirmButtonColor: '#2563eb' });
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
            Swal.fire({ icon: 'success', title: 'Thành công!', text: 'Cập nhật hợp đồng thành công', confirmButtonColor: '#2563eb' });
            setIsEditModalOpen(false);
            fetchContracts();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Thất bại!', text: 'Lỗi khi cập nhật hợp đồng', confirmButtonColor: '#2563eb' });
        }
    };

    const handleExtendContract = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentContract || !newEndDate) return;
        try {
            await contractService.extendHopDong(currentContract._id, newEndDate);
            Swal.fire({ icon: 'success', title: 'Thành công!', text: 'Gia hạn hợp đồng thành công', confirmButtonColor: '#2563eb' });
            setIsExtendModalOpen(false);
            fetchContracts();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Thất bại!', text: 'Lỗi khi gia hạn hợp đồng', confirmButtonColor: '#2563eb' });
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
            case "Con_Hieu_Luc": return "Đang hiệu lực";
            case "Ket_Thuc": return "Đã kết thúc";

            case "cho_ky": return "Chờ ký";
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Đang tải danh sách hợp đồng...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Hợp đồng</h1>
                    <p className="text-slate-500 mt-1 font-medium italic">Quản lý các cam kết thuê phòng</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {isAdmin && (
                        <button
                            onClick={() => {
                                setSelectedRoom("");
                                setSelectedUser("");
                                setSearchTerm("");
                                setRoomSearchTerm("");
                                setIsCreateModalOpen(true);
                            }}
                            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-black transition-all shadow-lg"
                        >
                            <Plus size={18} />
                            Tạo hợp đồng
                        </button>
                    )}
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm hợp đồng..."
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
                                    <h3 className="font-black text-slate-800 text-lg">Hợp đồng {contract.idPhong?.tenPhong || "Phòng"}</h3>

                                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getStatusStyle(contract.trangThai)}`}>
                                        {getStatusLabel(contract.trangThai)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-medium">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Calendar size={16} className="text-blue-500" />
                                        <span>{formatVi(contract.ngayBatDau)} - {contract.ngayKetThuc ? formatVi(contract.ngayKetThuc) : "Khách thuê linh hoạt"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <ShieldCheck size={16} className="text-emerald-500" />
                                        <span>Tiền cọc: <span className="font-bold text-slate-800">{(contract.tienCoc ?? 0).toLocaleString("vi-VN")}đ</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <AlertCircle size={16} className="text-amber-500" />
                                        <span>Giá thuê: <span className="font-bold text-blue-600">{(contract.giaThue ?? 0).toLocaleString("vi-VN")}đ/tháng</span></span>
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
                                    Xem chi tiết
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
                                                    <Edit3 size={14} /> Cập nhật
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCurrentContract(contract);
                                                        setNewEndDate(contract.ngayKetThuc || "");
                                                        setIsExtendModalOpen(true);
                                                    }}
                                                    className="flex items-center justify-center gap-2 flex-1 md:w-32 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white font-bold py-2 rounded-xl text-sm transition-all"
                                                >
                                                    <RefreshCw size={14} /> Gia hạn
                                                </button>
                                                <button
                                                    onClick={() => handleTerminateContract(contract._id)}
                                                    className="flex items-center justify-center gap-2 flex-1 md:w-32 bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-600 hover:text-white font-bold py-2 rounded-xl text-sm transition-all"
                                                >
                                                    <StopCircle size={14} /> Kết thúc
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleDeleteContract(contract._id)}
                                            className="flex items-center justify-center gap-2 flex-1 md:w-32 bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white font-bold py-2 rounded-xl text-sm transition-all"
                                        >
                                            <Trash2 size={14} /> Xóa
                                        </button>
                                    </>
                                )}
                                <button className="flex-1 md:w-32 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-2 rounded-xl text-sm transition-all">
                                    Tải về (PDF)
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center bg-white border border-dashed border-slate-300 rounded-3xl">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-medium">Hiện tại bạn chưa có hợp đồng nào.</p>
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
                                Tạo hợp đồng mới
                            </h2>
                            <button
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    setSearchTerm("");
                                }}
                                className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateContract} className="p-4 sm:p-8 space-y-5 sm:space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Chọn phòng trống</label>
                                    <div className="relative">
                                        <div className="relative">
                                            <LayoutTemplate className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                                placeholder="Nhập số phòng..."
                                                value={roomSearchTerm}
                                                onChange={(e) => {
                                                    setRoomSearchTerm(e.target.value);
                                                    setIsRoomDropdownOpen(true);
                                                    if (!e.target.value) setSelectedRoom("");
                                                }}
                                                onFocus={() => setIsRoomDropdownOpen(true)}
                                                required={!selectedRoom}
                                            />
                                        </div>

                                        {isRoomDropdownOpen && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                                {rooms.filter(r =>
                                                    r.tenPhong.toLowerCase().includes(roomSearchTerm.toLowerCase())
                                                ).length > 0 ? (
                                                    rooms.filter(r =>
                                                        r.tenPhong.toLowerCase().includes(roomSearchTerm.toLowerCase())
                                                    ).map(room => (
                                                        <button
                                                            key={room._id}
                                                            type="button"
                                                            className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex flex-col gap-0.5 transition-colors border-b border-slate-50 last:border-0"
                                                            onClick={() => {
                                                                handleRoomChange(room._id);
                                                                setRoomSearchTerm(room.tenPhong);
                                                                setIsRoomDropdownOpen(false);
                                                            }}
                                                        >
                                                            <span className="font-bold text-slate-800">{room.tenPhong}</span>
                                                            <span className="text-xs text-slate-400">{room.giaPhong.toLocaleString()}đ - {room.dienTich}m²</span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-sm text-slate-400 italic">Không tìm thấy phòng trống...</div>
                                                )}
                                            </div>
                                        )}
                                        {/* Hidden required field to ensure form validation */}
                                        <input type="hidden" value={selectedRoom} required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Chọn khách hàng</label>
                                    <div className="relative">
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                                placeholder="Tìm tên hoặc tên đăng nhập..."
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setIsUserDropdownOpen(true);
                                                }}
                                                onFocus={() => setIsUserDropdownOpen(true)}
                                                required={!selectedUser}
                                            />
                                        </div>

                                        {isUserDropdownOpen && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                                {users.filter(u =>
                                                    u.hoVaTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    u.tenDangNhap.toLowerCase().includes(searchTerm.toLowerCase())
                                                ).length > 0 ? (
                                                    users.filter(u =>
                                                        u.hoVaTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                        u.tenDangNhap.toLowerCase().includes(searchTerm.toLowerCase())
                                                    ).map(user => (
                                                        <button
                                                            key={user._id}
                                                            type="button"
                                                            className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex flex-col gap-0.5 transition-colors border-b border-slate-50 last:border-0"
                                                            onClick={() => {
                                                                setSelectedUser(user._id);
                                                                setSearchTerm(`${user.hoVaTen} (@${user.tenDangNhap})`);
                                                                setIsUserDropdownOpen(false);
                                                            }}
                                                        >
                                                            <span className="font-bold text-slate-800">{user.hoVaTen}</span>
                                                            <span className="text-xs text-slate-400">@{user.tenDangNhap}</span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-sm text-slate-400 italic">Không tìm thấy khách hàng...</div>
                                                )}
                                            </div>
                                        )}
                                        {/* Hidden required field to ensure form validation */}
                                        <input type="hidden" value={selectedUser} required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={ngayBatDau}
                                        onChange={(e) => setNgayBatDau(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ngày kết thúc (không bắt buộc)</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={ngayKetThuc}
                                        onChange={(e) => setNgayKetThuc(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Giá thuê (vnđ / tháng)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={giaThue}
                                        onChange={(e) => setGiaThue(Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tiền đặt cọc (vnđ)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={tienCoc}
                                        onChange={(e) => setTienCoc(Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Giá điện (vnđ / kWh)</label>
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
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Giá nước (vnđ / m³)</label>
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
                                Ký và Tạo hợp đồng
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
                                Cập nhật hợp đồng
                            </h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateContract} className="p-4 sm:p-8 space-y-5 sm:space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <p className="text-sm text-slate-500 font-medium">Đang chỉnh sửa hợp đồng cho phòng <span className="text-slate-900 font-bold">{currentContract.idPhong?.tenPhong}</span>.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Giá thuê (vnđ / tháng)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                                        value={editGiaThue}
                                        onChange={(e) => setEditGiaThue(Number(e.target.value))}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tiền đặt cọc (vnđ)</label>
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
                                        Giá điện (vnđ / kWh)
                                        {giaDien > 0 && <span className="text-blue-500 font-bold">HT: {giaDien.toLocaleString()}đ</span>}
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
                                        Giá nước (vnđ / m³)
                                        {giaNuoc > 0 && <span className="text-blue-500 font-bold">HT: {giaNuoc.toLocaleString()}đ</span>}
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
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ngày kết thúc</label>
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
                                Lưu thay đổi
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
                                Gia hạn hợp đồng
                            </h2>
                            <button onClick={() => setIsExtendModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleExtendContract} className="p-4 sm:p-8 space-y-5 sm:space-y-6 overflow-y-auto">
                            <div>
                                <p className="text-sm text-slate-500 mb-4 font-medium">Bạn đang thực hiện gia hạn hợp đồng cho phòng <span className="text-slate-900 font-bold">{currentContract.idPhong?.tenPhong}</span>.</p>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ngày kết thúc mới</label>
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
                                Xác nhận gia hạn
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
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Chi tiết hợp đồng</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mã HĐ: {currentContract._id.slice(-8).toUpperCase()}</p>
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
                                                    <span className="font-bold text-sm tracking-wide">Dãy {currentContract.idPhong?.idDayPhong?.soDay} - {currentContract.idPhong?.idDayPhong?.tenDay}</span>
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
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Thông tin thanh toán</h4>
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-white/50 text-xs font-bold uppercase mb-1">Giá thuê hàng tháng</p>
                                                <p className="text-3xl font-black text-blue-400">{(currentContract.giaThue ?? 0).toLocaleString("vi-VN")}<span className="text-xs ml-1 opacity-60">đ/tháng</span></p>
                                            </div>
                                            <div>
                                                <p className="text-white/50 text-xs font-bold uppercase mb-1">Tiền đặt cọc</p>
                                                <p className="text-2xl font-black text-emerald-400">{(currentContract.tienCoc ?? 0).toLocaleString("vi-VN")}<span className="text-xs ml-1 opacity-60">đ</span></p>
                                            </div>
                                            <div className="pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-white/50 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Zap size={10} /> Điện</p>
                                                    <p className="font-black text-amber-400">
                                                        {(currentContract.giaDien || giaDien || 0).toLocaleString("vi-VN")}
                                                        <span className="text-[10px] ml-1 opacity-60 italic font-medium tracking-normal text-white/40">
                                                            {!currentContract.giaDien ? "(HT)" : "đ"}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-white/50 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Droplets size={10} /> Nước</p>
                                                    <p className="font-black text-blue-300">
                                                        {(currentContract.giaNuoc || giaNuoc || 0).toLocaleString("vi-VN")}
                                                        <span className="text-[10px] ml-1 opacity-60 italic font-medium tracking-normal text-white/40">
                                                            {!currentContract.giaNuoc ? "(HT)" : "đ"}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 space-y-4">
                                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Thời hạn thuê</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 text-xs font-bold">Bắt đầu:</span>
                                                <span className="text-sm font-black text-slate-800">{formatVi(currentContract.ngayBatDau)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500 text-xs font-bold">Kết thúc:</span>
                                                <span className="text-sm font-black text-slate-800">{currentContract.ngayKetThuc ? formatVi(currentContract.ngayKetThuc) : "Linh hoạt"}</span>
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
                                        Chi tiết không gian
                                    </h3>
                                    <div className="bg-slate-50 p-8 rounded-[2rem] space-y-4 border border-slate-100">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-slate-500 text-sm font-medium">Diện tích:</span>
                                            <span className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">{currentContract.idPhong?.dienTich} m²</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-slate-500 text-sm font-medium">Loại phòng:</span>
                                            <span className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">{currentContract.idPhong?.loaiPhong?.replace("_", " ") || "Phòng thường"}</span>
                                        </div>

                                        {currentContract.idPhong?.vatTu && currentContract.idPhong?.vatTu.length > 0 && (
                                            <div className="pt-6 border-t border-slate-200 mt-4 space-y-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiện nghi có sẵn</p>
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
                                        Thông tin người thuê
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
                                                <span className="text-slate-500 text-sm font-medium">Số điện thoại:</span>
                                                <span className="font-black text-slate-800">{currentContract.idKhach?.soDienThoai || "Chưa cập nhật"}</span>
                                            </div>
                                            <div className="flex justify-between items-center group">
                                                <span className="text-slate-500 text-sm font-medium">CCCD / CMND:</span>
                                                <span className="font-black text-slate-800">{currentContract.idKhach?.cccd || "N/A"}</span>
                                            </div>
                                            {currentContract.idKhach?.email && (
                                                <div className="flex justify-between items-center group">
                                                    <span className="text-slate-500 text-sm font-medium">Email liên hệ:</span>
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
                                            Ghi chú & Điều khoản bổ sung
                                        </h3>
                                        <div className="bg-amber-50/30 p-5 sm:p-8 rounded-[2rem] space-y-4 border border-amber-100 flex flex-col sm:flex-row gap-4">
                                            <AlertCircle className="text-amber-500 shrink-0 mt-1" size={20} />
                                            <p className="text-slate-600 leading-relaxed font-medium italic">
                                                "{currentContract.idPhong?.moTa || currentContract.ghiChu || "Các quy định chung của nhà trọ được áp dụng cho hợp đồng này. Vui lòng tuân thủ quy tắc về giờ giấc và vệ sinh chung."}"
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
                                Đóng chi tiết
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
