import { Bed, Maximize, User, Trash2, Edit, Package, Layers } from "lucide-react";
import { useNavigate } from "react-router";
import { resolveBackendAssetUrl } from "../utils/url";

interface RoomCardProps {
    room: {
        id: string;
        name: string;
        price: number;
        status: "available" | "occupied";
        images: string[];
        area: number;
        capacity: number;
        loaiPhong?: string;
        dayPhong?: string;
        vatTu?: { tenVatTu: string }[];
    };
    isAdmin?: boolean;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}


const loaiPhongLabels: Record<string, string> = {
    Phong_Don: "Phòng đơn",
    Phong_Doi: "Phòng đôi",
    Phong_Ghep: "Phòng ghép",
    Phong_VIP: "Phòng VIP",
};

export default function RoomCard({ room, isAdmin, onEdit, onDelete }: RoomCardProps) {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="relative h-56 flex gap-1 p-1 bg-slate-50">
                <div className="flex-1 h-full rounded-l-xl overflow-hidden relative">
                    <img
                        src={room.images[0]?.startsWith('/uploads') ? resolveBackendAssetUrl(room.images[0]) : (room.images[0] || "/RoomPlaceholder.jpg")}
                        alt={`${room.name}-1`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-blue-900 border border-white/50 shadow-sm">
                        {room.status === "available" ? "ĐANG TRỐNG" : "ĐÃ CHO THUÊ"}
                    </div>
                </div>
                <div className="w-1/3 flex flex-col gap-1">
                    <div className="flex-1 rounded-tr-xl overflow-hidden">
                        <img
                            src={room.images[1] ? (room.images[1].startsWith('/uploads') ? resolveBackendAssetUrl(room.images[1]) : room.images[1]) : "/RoomPlaceholder.jpg"}
                            alt={`${room.name}-2`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>
                    <div className="flex-1 rounded-br-xl overflow-hidden relative">
                        <img
                            src={room.images[2] ? (room.images[2].startsWith('/uploads') ? resolveBackendAssetUrl(room.images[2]) : room.images[2]) : "/RoomPlaceholder.jpg"}
                            alt={`${room.name}-3`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {room.images.length > 3 && (
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <span className="text-white text-xs font-bold">+ {room.images.length - 3} ảnh</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                {room.name}
                            </h3>
                            {room.loaiPhong && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">
                                    {loaiPhongLabels[room.loaiPhong] || room.loaiPhong}
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-black text-blue-600">
                            {room.price.toLocaleString("vi-VN")}
                            <span className="text-xs font-medium text-slate-400 ml-1 italic">đ/tháng</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {isAdmin && (
                            <div className="flex gap-1">
                                <button
                                    onClick={() => onEdit?.(room.id)}
                                    className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => onDelete?.(room.id)}
                                    className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                        <div className={`p-2 rounded-lg ${room.status === "available" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                            <Bed size={20} />
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mb-4 space-y-2">
                    {room.dayPhong && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Layers size={14} className="text-slate-400" />
                            <span>Dãy: <span className="font-bold text-slate-700">{room.dayPhong}</span></span>
                        </div>
                    )}
                    {room.vatTu && room.vatTu.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Package size={14} className="text-slate-400" />
                            <span className="truncate">Vật tư: <span className="font-bold text-slate-700">{room.vatTu.map(v => v.tenVatTu).join(", ")}</span></span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Maximize size={16} className="text-slate-400" />
                        <span className="text-sm font-medium">{room.area}m²</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                        <User size={16} className="text-slate-400" />
                        <span className="text-sm font-medium">Tới {room.capacity} người</span>
                    </div>
                </div>

                <button
                    onClick={() => navigate(`/rooms/${room.id}`)}
                    className="w-full mt-5 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-200 transition-all duration-300"
                >
                    Xem chi tiết
                </button>
            </div>

        </div>
    );
}
