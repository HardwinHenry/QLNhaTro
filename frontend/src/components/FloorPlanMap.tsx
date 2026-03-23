import { useRef, useEffect, useState } from "react";
import type { Room } from "../services/roomService";
import type { DayPhong } from "../services/dayPhongService";
import { useNavigate } from "react-router";

import { ChevronDown, ChevronUp, Map as MapIcon } from "lucide-react";

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
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    // Group rooms: Day -> Tang -> rooms
    const grouped: Record<string, Record<string, Room[]>> = {};

    // Initialize with all dayPhongs if provided to ensure empty floors show up
    if (dayPhongs && dayPhongs.length > 0) {
        dayPhongs.forEach(dp => {
            const day = String(dp.soDay);
            const tang = String(dp.tang || "1");
            if (!grouped[day]) grouped[day] = {};
            if (!grouped[day][tang]) grouped[day][tang] = [];
        });
    }

    rooms.forEach((room) => {
        const tang = String(room.idDayPhong?.tang ?? "0");
        const day = String(room.idDayPhong?.soDay ?? "?");
        if (!grouped[day]) grouped[day] = {};
        if (!grouped[day][tang]) grouped[day][tang] = [];
        grouped[day][tang].push(room);
    });


    const sortedDays = Object.keys(grouped).sort((a, b) => {
        if (a === "?") return 1;
        if (b === "?") return -1;
        return a.localeCompare(b);
    });

    const floorSections: {
        day: string;
        tang: string;
        rooms: Room[];
    }[] = [];

    for (const day of sortedDays) {
        const tangs = grouped[day];
        const sortedTangs = Object.keys(tangs).sort((a, b) => {
            if (a === "0") return 1;
            if (b === "0") return -1;
            return Number(b) - Number(a);
        });
        for (const tang of sortedTangs) {
            floorSections.push({ day, tang, rooms: tangs[tang] });
        }
    }

    // Initialize/Update expansion
    useEffect(() => {
        const newExpanded: Record<string, boolean> = { ...expandedSections };
        let anyHighlighted = false;

        floorSections.forEach((section, idx) => {
            const key = `${section.day}-${section.tang}`;
            const hasHighlight = section.rooms.some(r => r._id === highlightRoomId);
            if (hasHighlight) {
                newExpanded[key] = true;
                anyHighlighted = true;
            } else if (Object.keys(expandedSections).length === 0 && idx === 0) {
                newExpanded[key] = true;
            }
        });

        if (anyHighlighted || Object.keys(expandedSections).length === 0) {
            setExpandedSections(newExpanded);
        }
    }, [highlightRoomId, rooms.length]);

    useEffect(() => {
        if (highlightRoomId && containerRef.current) {
            const el = containerRef.current.querySelector(`[data-room-id="${highlightRoomId}"]`);
            if (el) {
                setTimeout(() => {
                    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
                }, 400);
            }
        }
    }, [highlightRoomId, rooms]);

    const toggleSection = (key: string) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div ref={containerRef} className="space-y-6 w-full">
            {floorSections.map((section) => {
                const sectionKey = `${section.day}-${section.tang}`;
                const isExpanded = expandedSections[sectionKey];
                const roomCount = section.rooms.length;
                const topCount = Math.ceil(roomCount / 2);
                const bottomCount = roomCount - topCount;
                const maxCols = Math.max(topCount, bottomCount, 1);

                const blueprintW = maxCols * ROOM_W + (maxCols + 1) * WALL;
                const blueprintH = ROOM_H * 2 + CORRIDOR_H + WALL * 4;
                const svgW = blueprintW + PAD * 2;
                const svgH = blueprintH + PAD * 2 + 20;

                const topRooms = section.rooms.slice(0, topCount);
                const bottomRooms = section.rooms.slice(topCount);
                const ox = PAD;
                const oy = PAD;

                return (
                    <div key={sectionKey} className="bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
                        {/* Header toggle */}
                        <div
                            onClick={() => toggleSection(sectionKey)}
                            className="bg-white p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <MapIcon size={18} />
                                </div>
                                <h3 className="font-black text-slate-800 tracking-tight">
                                    Dãy {section.day === "?" ? "Khác" : section.day} — Tầng {section.tang === "0" ? "Trống" : section.tang}
                                    <span className="ml-3 text-xs font-bold text-slate-400 border-l border-slate-200 pl-3 uppercase tracking-widest">
                                        {roomCount} Phòng
                                    </span>
                                </h3>
                            </div>
                            <div className="p-1 px-3 bg-slate-100 text-slate-500 rounded-lg flex items-center gap-2 transition-all">
                                <span className="text-[10px] font-black uppercase tracking-tighter">{isExpanded ? "Thu gọn" : "Mở rộng"}</span>
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                        </div>

                        {/* Content */}
                        {isExpanded && (
                            <div className="p-4 pt-0 sm:p-6 sm:pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex flex-col lg:flex-row gap-6 items-start">
                                    {/* Sidebar rooms list */}
                                    <div className="shrink-0 w-full lg:w-48 grid grid-cols-2 lg:grid-cols-1 gap-1.5 pt-4">
                            {section.rooms.map((room, ri) => {
                                const isAvailable = room.trangThai === "Trong";
                                const isHighlighted = highlightRoomId === room._id;
                                return (
                                    <div
                                        key={room._id}
                                        onClick={() => navigate(`/rooms/${room._id}`)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-sm
                                            ${isHighlighted ? "bg-blue-100 text-blue-700 font-black" : "hover:bg-slate-50 text-slate-600"}`}
                                    >
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0
                                            ${isHighlighted ? "bg-blue-500" : isAvailable ? "bg-amber-400" : "bg-slate-400"}`}>
                                            {ri + 1}
                                        </span>
                                        <span className="font-semibold truncate">{room.tenPhong}</span>
                                        <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${isAvailable ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                                            {isAvailable ? "Trống" : "Thuê"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Blueprint drawing */}
                        <div className="flex-1 min-w-0 overflow-x-auto">
                            <svg
                                viewBox={`0 0 ${svgW} ${svgH}`}
                                className="w-full"
                                style={{ minWidth: `${Math.min(svgW, 500)}px`, maxHeight: "420px" }}
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {/* Background */}
                                <rect x="0" y="0" width={svgW} height={svgH} fill="#fafafa" rx="12" />

                                {/* Outer walls */}
                                <rect
                                    x={ox} y={oy}
                                    width={blueprintW} height={blueprintH}
                                    fill="none"
                                    stroke="#1a1a1a" strokeWidth={WALL}
                                />

                                {/* Corridor - horizontal lines separating top rooms from corridor and corridor from bottom rooms */}
                                {/* Top wall of corridor */}
                                <line
                                    x1={ox} y1={oy + ROOM_H + WALL}
                                    x2={ox + blueprintW} y2={oy + ROOM_H + WALL}
                                    stroke="#1a1a1a" strokeWidth={WALL / 2}
                                />
                                {/* Bottom wall of corridor */}
                                <line
                                    x1={ox} y1={oy + ROOM_H + WALL + CORRIDOR_H}
                                    x2={ox + blueprintW} y2={oy + ROOM_H + WALL + CORRIDOR_H}
                                    stroke="#1a1a1a" strokeWidth={WALL / 2}
                                />

                                {/* Corridor label */}
                                <text
                                    x={ox + blueprintW / 2}
                                    y={oy + ROOM_H + WALL + CORRIDOR_H / 2 + 4}
                                    textAnchor="middle"
                                    fill="#94a3b8"
                                    fontSize="11"
                                    fontWeight="700"
                                    letterSpacing="3"
                                >
                                    HÀNH LANG
                                </text>

                                {/* Stairs icon in corridor center */}
                                {(() => {
                                    const stairX = ox + blueprintW / 2 - 18;
                                    const stairY = oy + ROOM_H + WALL + 6;
                                    const stairW = 36;
                                    const stairH = CORRIDOR_H - 12;
                                    const steps = 5;
                                    return (
                                        <g opacity="0.3">
                                            <rect x={stairX} y={stairY} width={stairW} height={stairH} fill="none" stroke="#64748b" strokeWidth="1" />
                                            {Array.from({ length: steps }).map((_, i) => (
                                                <line
                                                    key={i}
                                                    x1={stairX}
                                                    y1={stairY + (i + 1) * (stairH / (steps + 1))}
                                                    x2={stairX + stairW}
                                                    y2={stairY + (i + 1) * (stairH / (steps + 1))}
                                                    stroke="#64748b"
                                                    strokeWidth="1"
                                                />
                                            ))}
                                            {/* Diagonal */}
                                            <line x1={stairX} y1={stairY} x2={stairX + stairW} y2={stairY + stairH} stroke="#64748b" strokeWidth="0.8" />
                                        </g>
                                    );
                                })()}

                                {/* TOP ROW ROOMS */}
                                {topRooms.map((room, i) => {
                                    const rx = ox + WALL / 2 + i * (ROOM_W + WALL);
                                    const ry = oy + WALL / 2;
                                    const isHighlighted = highlightRoomId === room._id;
                                    const isAvailable = room.trangThai === "Trong";
                                    const globalIdx = i;

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
                                            style={{ cursor: "pointer" }}
                                        >
                                            {/* Room fill */}
                                            <rect
                                                x={rx} y={ry}
                                                width={ROOM_W} height={ROOM_H}
                                                fill={isHighlighted ? "#dbeafe" : isAvailable ? "#f0fdf4" : "#f8fafc"}
                                                stroke={isHighlighted ? "#3b82f6" : "#1a1a1a"}
                                                strokeWidth={isHighlighted ? 3 : 1}
                                            />

                                            {/* Highlight pulse */}
                                            {isHighlighted && (
                                                <rect
                                                    x={rx - 3} y={ry - 3}
                                                    width={ROOM_W + 6} height={ROOM_H + 6}
                                                    fill="none" stroke="#3b82f6" strokeWidth="2" rx="2"
                                                >
                                                    <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                                                </rect>
                                            )}

                                            {/* Internal wall dividers (bathroom hint) */}
                                            <line
                                                x1={rx + ROOM_W * 0.65} y1={ry}
                                                x2={rx + ROOM_W * 0.65} y2={ry + ROOM_H * 0.45}
                                                stroke="#ccc" strokeWidth="1.5"
                                            />
                                            <line
                                                x1={rx + ROOM_W * 0.65} y1={ry + ROOM_H * 0.45}
                                                x2={rx + ROOM_W} y2={ry + ROOM_H * 0.45}
                                                stroke="#ccc" strokeWidth="1.5"
                                            />

                                            {/* Door arc on bottom side (facing corridor) */}
                                            <line
                                                x1={rx + ROOM_W / 2 - DOOR_W / 2}
                                                y1={ry + ROOM_H}
                                                x2={rx + ROOM_W / 2 + DOOR_W / 2}
                                                y2={ry + ROOM_H}
                                                stroke="#fafafa" strokeWidth="3"
                                            />
                                            <path
                                                d={`M ${rx + ROOM_W / 2 - DOOR_W / 2} ${ry + ROOM_H} A ${DOOR_W / 2} ${DOOR_W / 2} 0 0 0 ${rx + ROOM_W / 2 + DOOR_W / 2} ${ry + ROOM_H}`}
                                                fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2"
                                            />

                                            {/* Room number circle */}
                                            <circle
                                                cx={rx + ROOM_W * 0.35}
                                                cy={ry + ROOM_H * 0.55}
                                                r={LABEL_R}
                                                fill={isHighlighted ? "#3b82f6" : isAvailable ? "#f59e0b" : "#94a3b8"}
                                            />
                                            <text
                                                x={rx + ROOM_W * 0.35}
                                                y={ry + ROOM_H * 0.55 + 4.5}
                                                textAnchor="middle"
                                                fill="white"
                                                fontSize="12"
                                                fontWeight="900"
                                            >
                                                {globalIdx + 1}
                                            </text>

                                            {/* Vertical wall between rooms */}
                                            {i < topCount - 1 && (
                                                <line
                                                    x1={rx + ROOM_W + WALL / 2} y1={oy}
                                                    x2={rx + ROOM_W + WALL / 2} y2={oy + ROOM_H + WALL}
                                                    stroke="#1a1a1a" strokeWidth={WALL / 2}
                                                />
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
                                    const globalIdx = topCount + i;

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
                                            style={{ cursor: "pointer" }}
                                        >
                                            {/* Room fill */}
                                            <rect
                                                x={rx} y={ry}
                                                width={ROOM_W} height={ROOM_H}
                                                fill={isHighlighted ? "#dbeafe" : isAvailable ? "#f0fdf4" : "#f8fafc"}
                                                stroke={isHighlighted ? "#3b82f6" : "#1a1a1a"}
                                                strokeWidth={isHighlighted ? 3 : 1}
                                            />

                                            {/* Highlight pulse */}
                                            {isHighlighted && (
                                                <rect
                                                    x={rx - 3} y={ry - 3}
                                                    width={ROOM_W + 6} height={ROOM_H + 6}
                                                    fill="none" stroke="#3b82f6" strokeWidth="2" rx="2"
                                                >
                                                    <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                                                </rect>
                                            )}

                                            {/* Internal wall dividers */}
                                            <line
                                                x1={rx + ROOM_W * 0.65} y1={ry + ROOM_H}
                                                x2={rx + ROOM_W * 0.65} y2={ry + ROOM_H * 0.55}
                                                stroke="#ccc" strokeWidth="1.5"
                                            />
                                            <line
                                                x1={rx + ROOM_W * 0.65} y1={ry + ROOM_H * 0.55}
                                                x2={rx + ROOM_W} y2={ry + ROOM_H * 0.55}
                                                stroke="#ccc" strokeWidth="1.5"
                                            />

                                            {/* Door arc on top side (facing corridor) */}
                                            <line
                                                x1={rx + ROOM_W / 2 - DOOR_W / 2}
                                                y1={ry}
                                                x2={rx + ROOM_W / 2 + DOOR_W / 2}
                                                y2={ry}
                                                stroke="#fafafa" strokeWidth="3"
                                            />
                                            <path
                                                d={`M ${rx + ROOM_W / 2 - DOOR_W / 2} ${ry} A ${DOOR_W / 2} ${DOOR_W / 2} 0 0 1 ${rx + ROOM_W / 2 + DOOR_W / 2} ${ry}`}
                                                fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2"
                                            />

                                            {/* Room number circle */}
                                            <circle
                                                cx={rx + ROOM_W * 0.35}
                                                cy={ry + ROOM_H * 0.45}
                                                r={LABEL_R}
                                                fill={isHighlighted ? "#3b82f6" : isAvailable ? "#f59e0b" : "#94a3b8"}
                                            />
                                            <text
                                                x={rx + ROOM_W * 0.35}
                                                y={ry + ROOM_H * 0.45 + 4.5}
                                                textAnchor="middle"
                                                fill="white"
                                                fontSize="12"
                                                fontWeight="900"
                                            >
                                                {globalIdx + 1}
                                            </text>

                                            {/* Vertical wall between rooms */}
                                            {i < bottomCount - 1 && (
                                                <line
                                                    x1={rx + ROOM_W + WALL / 2} y1={oy + ROOM_H + WALL + CORRIDOR_H}
                                                    x2={rx + ROOM_W + WALL / 2} y2={oy + blueprintH}
                                                    stroke="#1a1a1a" strokeWidth={WALL / 2}
                                                />
                                            )}
                                        </g>
                                    );
                                })}

                                {/* Title */}
                                <text
                                    x={ox + blueprintW / 2}
                                    y={oy + blueprintH + 28}
                                    textAnchor="middle"
                                    fill="#1a1a1a"
                                    fontSize="13"
                                    fontWeight="900"
                                    letterSpacing="1"
                                    fontFamily="sans-serif"
                                >
                                    MẶT BẰNG {section.day === "?" ? "KHU VỰC KHÁC" : `DÃY ${section.day}`} — TẦNG {section.tang === "0" ? "KHÁC" : section.tang}
                                </text>
                            </svg>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Floating tooltip */}
            {tooltip && (
                <div
                    className="fixed z-50 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
                    style={{ left: tooltip.x, top: tooltip.y - 8 }}
                >
                    <p className="font-black text-sm">{tooltip.room.tenPhong}</p>
                    <p className="text-xs text-slate-300 mt-0.5">
                        {tooltip.room.giaPhong.toLocaleString("vi-VN")}đ/tháng · {tooltip.room.dienTich}m² · {tooltip.room.sucChua} người
                    </p>
                    <p className="text-[10px] mt-1 font-bold">
                        {tooltip.room.trangThai === "Trong" ? (
                            <span className="text-emerald-400">● Đang trống</span>
                        ) : (
                            <span className="text-slate-400">● Đã cho thuê</span>
                        )}
                    </p>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-800"></div>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 justify-center pt-4 pb-2">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                        <span className="text-[8px] font-black text-white">N</span>
                    </div>
                    <span className="text-xs font-bold text-slate-600">Đang trống</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <div className="w-5 h-5 rounded-full bg-slate-400 flex items-center justify-center">
                        <span className="text-[8px] font-black text-white">N</span>
                    </div>
                    <span className="text-xs font-bold text-slate-600">Đã cho thuê</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-[8px] font-black text-white">N</span>
                    </div>
                    <span className="text-xs font-bold text-slate-600">Đang xem</span>
                </div>
            </div>
        </div>
    );
}
