import { useRef, useEffect, useState } from "react";
import type { Room } from "../services/roomService";
import type { DayPhong } from "../services/dayPhongService";
import { useNavigate } from "react-router";

import { Map as MapIcon } from "lucide-react";


interface FloorPlanMapProps {
    rooms: Room[];
    dayPhongs?: DayPhong[];
    highlightRoomId?: string | null;
}


// Blueprint style constants
const WALL = 6;          // Wall thickness
const ROOM_W = 110;      // Room width
const ROOM_H = 90;       // Room depth
const CORRIDOR_H = 50;   // Corridor height
const DOOR_W = 20;       // Door width
const LABEL_R = 14;      // Room number circle radius
const PAD = 30;           // Padding around blueprint

export default function FloorPlanMap({ rooms, dayPhongs, highlightRoomId }: FloorPlanMapProps) {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ room: Room; x: number; y: number } | null>(null);
    
    // Group rooms: Tang -> Day -> rooms
    const groupedByFloor: Record<string, Record<string, Room[]>> = {};

    // Initialize with all dayPhongs if provided
    if (dayPhongs && dayPhongs.length > 0) {
        dayPhongs.forEach(dp => {
            const tang = String(dp.tang || "1");
            const day = String(dp.soDay);
            if (!groupedByFloor[tang]) groupedByFloor[tang] = {};
            if (!groupedByFloor[tang][day]) groupedByFloor[tang][day] = [];
        });
    }

    rooms.forEach((room) => {
        const tang = String(room.idDayPhong?.tang ?? "0");
        const day = String(room.idDayPhong?.soDay ?? "?");
        if (!groupedByFloor[tang]) groupedByFloor[tang] = {};
        if (!groupedByFloor[tang][day]) groupedByFloor[tang][day] = [];
        groupedByFloor[tang][day].push(room);
    });

    const floors = Object.keys(groupedByFloor).sort((a, b) => {
        if (a === "0") return 1;
        if (b === "0") return -1;
        return Number(a) - Number(b);
    });

    const [activeFloor, setActiveFloor] = useState<string>(floors[0] || "1");
    const [activeDay, setActiveDay] = useState<string>("");

    // Update active floor/day when highlight changes
    useEffect(() => {
        if (highlightRoomId) {
            const room = rooms.find(r => r._id === highlightRoomId);
            if (room) {
                const tang = String(room.idDayPhong?.tang ?? "0");
                const day = String(room.idDayPhong?.soDay ?? "?");
                setActiveFloor(tang);
                setActiveDay(day);
            }
        }
    }, [highlightRoomId, rooms]);

    const availableDays = activeFloor ? Object.keys(groupedByFloor[activeFloor] || {}).sort() : [];
    
    // Set default day when floor changes
    useEffect(() => {
        if (availableDays.length > 0 && (!activeDay || !availableDays.includes(activeDay))) {
            setActiveDay(availableDays[0]);
        }
    }, [activeFloor, availableDays]);

    const currentSectionRooms = (activeFloor && activeDay) ? groupedByFloor[activeFloor][activeDay] : [];

    return (
        <div ref={containerRef} className="space-y-8 w-full min-h-[600px] flex flex-col">
            {/* Map Header & Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-200/60 shadow-inner">
                <div className="flex flex-col gap-4 w-full md:w-auto">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Chọn Tầng (Floor)</label>
                    <div className="flex flex-wrap gap-2">
                        {floors.map(tang => (
                            <button
                                key={tang}
                                onClick={() => setActiveFloor(tang)}
                                className={`px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg ${activeFloor === tang
                                    ? "bg-blue-600 text-white shadow-blue-200"
                                    : "bg-white text-slate-600 border border-slate-200 hover:border-blue-200 hover:text-blue-600 shadow-slate-100"
                                    }`}
                            >
                                Tầng {tang === "0" ? "Tân" : tang}
                            </button>
                        ))}
                    </div>
                </div>

                {availableDays.length > 1 && (
                    <div className="flex flex-col gap-4 w-full md:w-auto">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Chọn Dãy (Row)</label>
                        <div className="flex flex-wrap gap-2">
                            {availableDays.map(day => (
                                <button
                                    key={day}
                                    onClick={() => setActiveDay(day)}
                                    className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 border-2 ${activeDay === day
                                        ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                                        }`}
                                >
                                    Dãy {day === "?" ? "Khác" : day}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Interactive Map Area */}
            <div className="flex-1 flex flex-col lg:flex-row gap-8 items-stretch h-full">
                {/* Visual Map (3/4 width on desktop) */}
                <div className="flex-[3] bg-white rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-100 p-4 sm:p-8 flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
                    
                    {currentSectionRooms.length > 0 ? (
                        <div className="w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                            {(() => {
                                const roomCount = currentSectionRooms.length;
                                const topCount = Math.ceil(roomCount / 2);
                                const bottomCount = roomCount - topCount;
                                const maxCols = Math.max(topCount, bottomCount, 1);

                                const blueprintW = maxCols * ROOM_W + (maxCols + 1) * WALL;
                                const blueprintH = ROOM_H * 2 + CORRIDOR_H + WALL * 4;
                                const svgW = blueprintW + PAD * 2;
                                const svgH = blueprintH + PAD * 2 + 20;

                                const topRooms = currentSectionRooms.slice(0, topCount);
                                const bottomRooms = currentSectionRooms.slice(topCount);
                                const ox = PAD;
                                const oy = PAD;

                                return (
                                    <svg
                                        viewBox={`0 0 ${svgW} ${svgH}`}
                                        className="w-full h-full drop-shadow-2xl"
                                        style={{ maxHeight: "550px", transform: "perspective(1000px) rotateX(2deg)" }}
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        {/* Ground Shadow */}
                                        <rect x={ox + 10} y={oy + 10} width={blueprintW} height={blueprintH} fill="#0000000a" rx="4" />

                                        {/* Outer walls */}
                                        <rect
                                            x={ox} y={oy}
                                            width={blueprintW} height={blueprintH}
                                            fill="#ffffff"
                                            stroke="#1e293b" strokeWidth={WALL}
                                            rx="2"
                                        />

                                        {/* Corridor */}
                                        <rect
                                            x={ox + WALL/2} y={oy + ROOM_H + WALL/2}
                                            width={blueprintW - WALL} height={CORRIDOR_H + WALL}
                                            fill="#f8fafc"
                                            stroke="#cbd5e1"
                                            strokeWidth="1"
                                        />
                                        <text
                                            x={ox + blueprintW / 2}
                                            y={oy + ROOM_H + WALL + CORRIDOR_H / 2 + 4}
                                            textAnchor="middle"
                                            fill="#94a3b8"
                                            fontSize="10"
                                            fontWeight="800"
                                            letterSpacing="4"
                                            className="select-none"
                                        >
                                            HÀNH LANG TRUNG TÂM
                                        </text>

                                        {/* TOP ROW ROOMS */}
                                        {topRooms.map((room, i) => {
                                            const rx = ox + WALL / 2 + i * (ROOM_W + WALL);
                                            const ry = oy + WALL / 2;
                                            const isHighlighted = highlightRoomId === room._id;
                                            const isAvailable = room.trangThai === "Trong";
                                            return (
                                                <g
                                                    key={room._id}
                                                    data-room-id={room._id}
                                                    onClick={() => navigate(`/rooms/${room._id}`)}
                                                    onMouseEnter={(e) => {
                                                        const rect = (e.currentTarget as SVGGElement).getBoundingClientRect();
                                                        setTooltip({ room, x: rect.left + rect.width / 2, y: rect.top });
                                                    }}
                                                    onMouseLeave={() => setTooltip(null)}
                                                    className="cursor-pointer transition-all duration-300 hover:brightness-105"
                                                >
                                                    <rect
                                                        x={rx} y={ry} width={ROOM_W} height={ROOM_H}
                                                        fill={isHighlighted ? "#eff6ff" : isAvailable ? "#f0fdf4" : "#f8fafc"}
                                                        stroke={isHighlighted ? "#3b82f6" : "#475569"}
                                                        strokeWidth={isHighlighted ? 4 : 1.5}
                                                        className="transition-colors"
                                                    />
                                                    
                                                    {/* Door Arc */}
                                                    <path
                                                        d={`M ${rx + ROOM_W / 2 - DOOR_W / 2} ${ry + ROOM_H} A ${DOOR_W / 2} ${DOOR_W / 2} 0 0 0 ${rx + ROOM_W / 2 + DOOR_W / 2} ${ry + ROOM_H}`}
                                                        fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3"
                                                    />

                                                    {/* Label Circle */}
                                                    <circle
                                                        cx={rx + ROOM_W / 2}
                                                        cy={ry + ROOM_H / 2}
                                                        r={LABEL_R}
                                                        fill={isHighlighted ? "#3b82f6" : isAvailable ? "#10b981" : "#64748b"}
                                                    />
                                                    <text
                                                        x={rx + ROOM_W / 2}
                                                        y={ry + ROOM_H / 2 + 4.5}
                                                        textAnchor="middle" fill="white" fontSize="11" fontWeight="900"
                                                    >
                                                        {room.tenPhong.replace(/\D/g, '') || (i + 1)}
                                                    </text>
                                                    
                                                    {isHighlighted && (
                                                        <rect x={rx-2} y={ry-2} width={ROOM_W+4} height={ROOM_H+4} fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.3">
                                                            <animate attributeName="stroke-width" values="2;6;2" dur="2s" repeatCount="indefinite" />
                                                        </rect>
                                                    )}
                                                </g>
                                            );
                                        })}

                                        {/* BOTTOM ROW ROOMS */}
                                        {bottomRooms.map((room, i) => {
                                            const rx = ox + WALL / 2 + i * (ROOM_W + WALL);
                                            const ry = oy + ROOM_H + WALL + CORRIDOR_H + WALL / 2;
                                            const isHighlighted = highlightRoomId === room._id;
                                            const isAvailable = room.trangThai === "Trong";
                                            return (
                                                <g
                                                    key={room._id}
                                                    data-room-id={room._id}
                                                    onClick={() => navigate(`/rooms/${room._id}`)}
                                                    onMouseEnter={(e) => {
                                                        const rect = (e.currentTarget as SVGGElement).getBoundingClientRect();
                                                        setTooltip({ room, x: rect.left + rect.width / 2, y: rect.top });
                                                    }}
                                                    onMouseLeave={() => setTooltip(null)}
                                                    className="cursor-pointer transition-all duration-300 hover:brightness-105"
                                                >
                                                    <rect
                                                        x={rx} y={ry} width={ROOM_W} height={ROOM_H}
                                                        fill={isHighlighted ? "#eff6ff" : isAvailable ? "#f0fdf4" : "#f8fafc"}
                                                        stroke={isHighlighted ? "#3b82f6" : "#475569"}
                                                        strokeWidth={isHighlighted ? 4 : 1.5}
                                                    />
                                                    
                                                    {/* Door Arc */}
                                                    <path
                                                        d={`M ${rx + ROOM_W / 2 - DOOR_W / 2} ${ry} A ${DOOR_W / 2} ${DOOR_W / 2} 0 0 1 ${rx + ROOM_W / 2 + DOOR_W / 2} ${ry}`}
                                                        fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3"
                                                    />

                                                    <circle
                                                        cx={rx + ROOM_W / 2}
                                                        cy={ry + ROOM_H / 2}
                                                        r={LABEL_R}
                                                        fill={isHighlighted ? "#3b82f6" : isAvailable ? "#10b981" : "#64748b"}
                                                    />
                                                    <text
                                                        x={rx + ROOM_W / 2}
                                                        y={ry + ROOM_H / 2 + 4.5}
                                                        textAnchor="middle" fill="white" fontSize="11" fontWeight="900"
                                                    >
                                                        {room.tenPhong.replace(/\D/g, '') || (topRooms.length + i + 1)}
                                                    </text>
                                                </g>
                                            );
                                        })}

                                        <text
                                            x={ox + blueprintW / 2}
                                            y={oy + blueprintH + 30}
                                            textAnchor="middle"
                                            fill="#1e293b" fontSize="14" fontWeight="900" letterSpacing="1"
                                        >
                                            SƠ ĐỒ MẶT BẰNG {activeDay === "?" ? "" : `DÃY ${activeDay}`} — TẦNG {activeFloor === "0" ? "TRỐNG" : activeFloor}
                                        </text>
                                    </svg>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-6 bg-slate-50 rounded-full text-slate-300">
                                <MapIcon size={64} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xl font-black text-slate-800">Chưa có phòng ở khu vực này</h4>
                                <p className="text-slate-400 font-medium">Bắt đầu bằng cách thêm phòng mới vào Tầng {activeFloor} {activeDay && `Dãy ${activeDay}`}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info (1/4 width on desktop) */}
                <div className="flex-1 min-w-[300px] flex flex-col gap-6">
                    <div className="bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-6 text-white shadow-2xl flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black tracking-tight">Danh sách phòng</h3>
                            <span className="bg-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                {currentSectionRooms.length} Phòng
                            </span>
                        </div>
                        
                        <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {currentSectionRooms.length > 0 ? (
                                currentSectionRooms.map((room, idx) => (
                                    <div
                                        key={room._id}
                                        onClick={() => navigate(`/rooms/${room._id}`)}
                                        className={`group flex items-center justify-between p-4 rounded-3xl transition-all cursor-pointer border-2
                                            ${highlightRoomId === room._id 
                                                ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20" 
                                                : "bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800"}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-colors
                                                ${highlightRoomId === room._id ? "bg-white text-blue-600" : "bg-slate-700 text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-500"}`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm leading-none mb-1">{room.tenPhong}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{room.loaiPhong?.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-blue-400">{room.giaPhong.toLocaleString()}đ</p>
                                            <span className={`text-[9px] font-black uppercase tracking-tighter ${room.trangThai === "Trong" ? "text-emerald-400" : "text-slate-500"}`}>
                                                {room.trangThai === "Trong" ? "Đang trống" : "Đã thuê"}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-center py-12 font-bold italic">Không có dữ liệu</p>
                            )}
                        </div>

                        <div className="mt-auto pt-8 border-t border-slate-800">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-4 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Diện tích TB</p>
                                    <p className="text-lg font-black">{currentSectionRooms.length > 0 ? (currentSectionRooms.reduce((a,b)=>a+b.dienTich, 0) / currentSectionRooms.length).toFixed(1) : 0}m²</p>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Giá TB</p>
                                    <p className="text-sm font-black text-blue-400">{currentSectionRooms.length > 0 ? (currentSectionRooms.reduce((a,b)=>a+b.giaPhong, 0) / currentSectionRooms.length / 1000).toFixed(0) : 0}k/m²</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-xl shadow-slate-100 flex flex-wrap gap-4 items-center justify-center">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Trống</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Đã Thuê</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-600 shadow-sm shadow-blue-200"></div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Đang Chọn</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating tooltip */}
            {tooltip && (
                <div
                    className="fixed z-50 bg-slate-900/95 backdrop-blur-md text-white px-5 py-4 rounded-[1.5rem] shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full border border-slate-700/50"
                    style={{ left: tooltip.x, top: tooltip.y - 12 }}
                >
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-10">
                            <p className="font-black text-sm">{tooltip.room.tenPhong}</p>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${tooltip.room.trangThai === "Trong" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                                {tooltip.room.trangThai === "Trong" ? "CÒN TRỐNG" : "ĐÃ THUÊ"}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                            {tooltip.room.giaPhong.toLocaleString("vi-VN")}đ/tháng · {tooltip.room.dienTich}m² · {tooltip.room.sucChua} người
                        </p>
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-slate-900/95"></div>
                </div>
            )}
        </div>
    );
}
