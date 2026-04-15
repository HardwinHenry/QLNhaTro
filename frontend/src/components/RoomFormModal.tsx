import { useEffect, useState } from "react";
import { X, Loader2, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { roomService, type Room } from "../services/roomService";
import { dayPhongService, type DayPhong } from "../services/dayPhongService";
import { vatTuService, type VatTu } from "../services/vatTuService";
import { toast } from "sonner";
import { resolveBackendAssetUrl } from "../utils/url";

const roomSchema = z.object({
    idPhong: z.string().min(1, "Mã phòng là bắt buộc"),
    tenPhong: z.string().min(1, "Tên phòng là bắt buộc"),
    idDayPhong: z.string().min(1, "Dãy phòng là bắt buộc"),
    giaPhong: z.number().min(0, "Giá phòng phải >= 0"),
    dienTich: z.number().min(0, "Diện tích phải >= 0"),
    loaiPhong: z.string().optional(),
    moTa: z.string().optional(),
    trangThai: z.enum(["Trong", "Da_Thue"]),
    hinhAnh: z.any().optional(),
    vatTu: z.array(z.string()).optional(),
});

type RoomFormValues = z.infer<typeof roomSchema>;

interface RoomFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingRoom?: Room | null;
}

export default function RoomFormModal({ isOpen, onClose, onSuccess, editingRoom }: RoomFormModalProps) {
    const [dayPhongs, setDayPhongs] = useState<DayPhong[]>([]);
    const [vatTus, setVatTus] = useState<VatTu[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRow, setSelectedRow] = useState<string>("");

    interface ImagePreview {
        id: string;
        url: string;
        file?: File;
        isExisting: boolean;
        originalPath?: string;
    }

    const [images, setImages] = useState<ImagePreview[]>([]);

    const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<RoomFormValues>({
        resolver: zodResolver(roomSchema),
        defaultValues: {
            trangThai: "Trong",
            vatTu: []
        }
    });


    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dp, vt] = await Promise.all([
                    dayPhongService.getAllDayPhongs(),
                    vatTuService.getAllVatTus()
                ]);
                setDayPhongs(dp);
                setVatTus(vt);
            } catch (error) {
                toast.error("Lỗi khi tải dữ liệu bổ trợ");
            } finally {
                // Done loading
            }

        };

        if (isOpen) fetchData();
    }, [isOpen]);

    useEffect(() => {
        if (editingRoom) {
            reset({
                idPhong: editingRoom.idPhong,
                tenPhong: editingRoom.tenPhong,
                idDayPhong: editingRoom.idDayPhong?._id || editingRoom.idDayPhong,
                giaPhong: editingRoom.giaPhong,
                dienTich: editingRoom.dienTich,
                loaiPhong: editingRoom.loaiPhong,
                moTa: editingRoom.moTa,
                trangThai: editingRoom.trangThai,
                hinhAnh: editingRoom.hinhAnh,
                vatTu: editingRoom.vatTu?.map(v => typeof v === 'string' ? v : v._id) || []
            });
            
            const existingImages = Array.isArray(editingRoom.hinhAnh) 
                ? editingRoom.hinhAnh 
                : (editingRoom.hinhAnh ? [editingRoom.hinhAnh] : []);
            
            setImages(existingImages.map((img, idx) => ({
                id: `existing-${idx}`,
                url: resolveBackendAssetUrl(img),
                isExisting: true,
                originalPath: img
            } as any)));
        } else {
            reset({
                idPhong: "",
                tenPhong: "",
                idDayPhong: "",
                giaPhong: 0,
                dienTich: 0,
                loaiPhong: "",
                moTa: "",
                trangThai: "Trong",
                hinhAnh: [],
                vatTu: []
            });
            setImages([]);
        }
    }, [editingRoom, reset, isOpen]);

    // Update selected row when editing room
    useEffect(() => {
        if (editingRoom && dayPhongs.length > 0) {
            const currentDayPhong = dayPhongs.find(dp => dp._id === (editingRoom.idDayPhong?._id || editingRoom.idDayPhong));
            if (currentDayPhong) {
                setSelectedRow(currentDayPhong.soDay);
            }
        }
    }, [editingRoom, dayPhongs]);

    const watchedIdDayPhong = watch("idDayPhong");

    // Auto-populate dienTich when idDayPhong changes
    useEffect(() => {
        if (watchedIdDayPhong && dayPhongs.length > 0) {
            const selectedDay = dayPhongs.find(dp => dp._id === watchedIdDayPhong);
            if (selectedDay) {
                // Only auto-fill if the current dienTich is 0 (new room) OR if we're not in initial edit load
                // Actually, more intuitive: if it matches the PREVIOUS selectedDay's dienTich, or if it's 0.
                // For simplicity, let's just auto-fill if it's a NEW room (no editingRoom)
                if (!editingRoom && selectedDay.dienTich > 0) {
                    setValue("dienTich", selectedDay.dienTich);
                }
            }
        }
    }, [watchedIdDayPhong, dayPhongs, editingRoom, setValue]);

    const uniqueRows = Array.from(new Set(dayPhongs.map(dp => dp.soDay))).sort();
    const filteredDayPhongsByRow = dayPhongs.filter(dp => dp.soDay === selectedRow);

    const onSubmit = async (values: RoomFormValues) => {
        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(values).forEach(([key, value]) => {
                if (key === "vatTu" && Array.isArray(value)) {
                    value.forEach(v => formData.append("vatTu[]", v));
                } else if (key === "hinhAnh") {
                    // Skip handling hinhAnh here, we'll do it manually below
                } else if (value !== undefined && value !== null) {
                    formData.append(key, value.toString());
                }
            });

            // Handle images
            const existingHinhAnh = images
                .filter(img => img.isExisting)
                .map(img => (img as any).originalPath);
            
            existingHinhAnh.forEach(path => formData.append("existingHinhAnh[]", path));

            const newFiles = images
                .filter(img => !img.isExisting && img.file)
                .map(img => img.file as File);
            
            newFiles.forEach(file => formData.append("hinhAnh", file));

            if (editingRoom) {
                await roomService.updatePhong(editingRoom._id, formData);
                toast.success("Cập nhật phòng thành công");
            } else {
                await roomService.createPhong(formData);
                toast.success("Thêm phòng mới thành công");
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const selectedVatTu = watch("vatTu") || [];

    const handleVatTuToggle = (id: string) => {
        const current = [...selectedVatTu];
        const index = current.indexOf(id);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(id);
        }
        setValue("vatTu", current);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                        {editingRoom ? "Cập nhật thông tin phòng" : "Thêm phòng mới"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã phòng <span className="text-red-500 ml-0.5">*</span></label>
                            <input
                                {...register("idPhong")}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="P101"
                            />
                            {errors.idPhong && <p className="text-[10px] text-red-500 font-bold">{errors.idPhong.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên phòng <span className="text-red-500 ml-0.5">*</span></label>
                            <input
                                {...register("tenPhong")}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Phòng 101"
                            />
                            {errors.tenPhong && <p className="text-[10px] text-red-500 font-bold">{errors.tenPhong.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dãy phòng <span className="text-red-500 ml-0.5">*</span></label>
                            <select
                                value={selectedRow}
                                onChange={(e) => {
                                    setSelectedRow(e.target.value);
                                    setValue("idDayPhong", ""); // Reset specific floor selection when row changes
                                }}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            >
                                <option value="">Chọn dãy phòng</option>
                                {uniqueRows.map(row => (
                                    <option key={row} value={row}>Dãy {row}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tầng <span className="text-red-500 ml-0.5">*</span></label>
                            <select
                                {...register("idDayPhong")}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                disabled={!selectedRow}
                            >
                                <option value="">Chọn tầng</option>
                                {filteredDayPhongsByRow.map(day => (
                                    <option key={day._id} value={day._id}>Tầng {day.tang === 0 ? "Trệt" : day.tang}</option>
                                ))}
                            </select>
                            {errors.idDayPhong && <p className="text-[10px] text-red-500 font-bold">{errors.idDayPhong.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Diện tích (m²) <span className="text-red-500 ml-0.5">*</span></label>
                            <input
                                type="number"
                                {...register("dienTich", { valueAsNumber: true })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giá phòng (VNĐ) <span className="text-red-500 ml-0.5">*</span></label>
                            <input
                                type="number"
                                {...register("giaPhong", { valueAsNumber: true })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-blue-600"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loại phòng <span className="text-red-500 ml-0.5">*</span></label>
                            <select
                                {...register("loaiPhong")}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            >
                                <option value="">Chọn loại phòng</option>
                                <option value="Co_Gac">Có gác</option>
                                <option value="Khong_Gac">Không có gác</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</label>
                            <select
                                {...register("trangThai")}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            >
                                <option value="Trong">Trống</option>
                                <option value="Da_Thue">Đã thuê</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vật tư trang bị</label>
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-32 overflow-y-auto">
                            {vatTus.map(vt => (
                                <button
                                    key={vt._id}
                                    type="button"
                                    onClick={() => handleVatTuToggle(vt._id)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${selectedVatTu.includes(vt._id)
                                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                                        : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"
                                        }`}
                                >
                                    {vt.tenVatTu}
                                </button>
                            ))}
                            {vatTus.length === 0 && <p className="text-xs text-slate-400 italic">Chưa có vật tư nào trong hệ thống</p>}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ảnh phòng ({images.length}/10)</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {images.map((img) => (
                                <div key={img.id} className="relative aspect-video rounded-xl overflow-hidden group border border-slate-200">
                                    <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImages(prev => prev.filter(i => i.id !== img.id));
                                            }}
                                            className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all font-bold text-[10px]"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    {!img.isExisting && (
                                        <div className="absolute top-1 left-1 bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                                            Mới
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {images.length < 10 && (
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('room-image-upload')?.click()}
                                    className="aspect-video border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                >
                                    <Upload size={18} />
                                    <span className="text-[10px] font-bold">Thêm ảnh</span>
                                </button>
                            )}
                        </div>
                        <input
                            id="room-image-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length > 0) {
                                    const newImages: ImagePreview[] = files.map(file => ({
                                        id: `new-${Date.now()}-${Math.random()}`,
                                        url: URL.createObjectURL(file),
                                        file: file,
                                        isExisting: false
                                    }));
                                    setImages(prev => [...prev, ...newImages].slice(0, 10));
                                    // Reset input so the same file can be selection again
                                    e.target.value = "";
                                }
                            }}
                            className="hidden"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả</label>
                        <textarea
                            {...register("moTa")}
                            rows={3}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                            placeholder="Chi tiết về tiện ích, nội thất..."
                        />
                    </div>
                </form>

                <div className="p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={loading}
                        className="px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center disabled:opacity-50 sm:flex-[2]"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (editingRoom ? "Lưu thay đổi" : "Thêm phòng")}
                    </button>
                </div>
            </div>
        </div>
    );
}
