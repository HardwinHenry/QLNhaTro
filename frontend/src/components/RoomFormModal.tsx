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
    const [selectedFloor, setSelectedFloor] = useState<string>("");


    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

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
                hinhAnh: typeof editingRoom.hinhAnh === 'string' ? editingRoom.hinhAnh : editingRoom.hinhAnh?.[0],
                vatTu: editingRoom.vatTu?.map(v => typeof v === 'string' ? v : v._id) || []
            });
            const mainImg = typeof editingRoom.hinhAnh === 'string' ? editingRoom.hinhAnh : editingRoom.hinhAnh?.[0];
            setImagePreview(mainImg ? resolveBackendAssetUrl(mainImg) : null);
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
                hinhAnh: "",
                vatTu: []
            });
            setImagePreview(null);
            setImageFile(null);
        }
    }, [editingRoom, reset, isOpen]);

    // Update selected floor when editing room
    useEffect(() => {
        if (editingRoom && dayPhongs.length > 0) {
            const currentDayPhong = dayPhongs.find(dp => dp._id === (editingRoom.idDayPhong?._id || editingRoom.idDayPhong));
            if (currentDayPhong) {
                setSelectedFloor(currentDayPhong.tang.toString());
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

    const uniqueFloors = Array.from(new Set(dayPhongs.map(dp => dp.tang.toString()))).sort((a, b) => Number(a) - Number(b));
    const filteredDayPhongs = dayPhongs.filter(dp => dp.tang.toString() === selectedFloor);

    const onSubmit = async (values: RoomFormValues) => {
        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(values).forEach(([key, value]) => {
                if (key === "vatTu" && Array.isArray(value)) {
                    value.forEach(v => formData.append("vatTu[]", v));
                } else if (key === "hinhAnh") {
                    if (imageFile) {
                        formData.append("hinhAnh", imageFile);
                    } else if (typeof value === 'string' && value) {
                        formData.append("hinhAnh", value);
                    }
                } else if (value !== undefined && value !== null) {
                    formData.append(key, value.toString());
                }
            });

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
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tầng <span className="text-red-500 ml-0.5">*</span></label>
                            <select
                                value={selectedFloor}
                                onChange={(e) => {
                                    setSelectedFloor(e.target.value);
                                    setValue("idDayPhong", ""); // Reset row selection when floor changes
                                }}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            >
                                <option value="">Chọn tầng</option>
                                {uniqueFloors.map(floor => (
                                    <option key={floor} value={floor}>Tầng {floor === "0" ? "Trệt" : floor}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dãy phòng <span className="text-red-500 ml-0.5">*</span></label>
                            <select
                                {...register("idDayPhong")}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                disabled={!selectedFloor}
                            >
                                <option value="">Chọn dãy phòng</option>
                                {filteredDayPhongs.map(day => (
                                    <option key={day._id} value={day._id}>Dãy {day.soDay} - {day.viTri}</option>
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
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ảnh phòng (Upload)</label>
                        <div className="flex flex-col gap-3">
                            {imagePreview ? (
                                <div className="relative w-full h-48 rounded-2xl overflow-hidden group border border-slate-200">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('room-image-upload')?.click()}
                                            className="px-4 py-2 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-all font-bold text-xs"
                                        >
                                            Thay đổi
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImagePreview(null);
                                                setImageFile(null);
                                                setValue("hinhAnh", "");
                                            }}
                                            className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all font-bold text-xs"
                                        >
                                            Gỡ bỏ
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('room-image-upload')?.click()}
                                    className="w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                >
                                    <div className="p-2 bg-slate-50 rounded-full">
                                        <Upload size={20} />
                                    </div>
                                    <span className="text-xs font-bold">Tải lên hình ảnh phòng</span>
                                </button>
                            )}
                            <input
                                id="room-image-upload"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setImageFile(file);
                                        setValue("hinhAnh", file);
                                        const reader = new FileReader();
                                        reader.onloadend = () => setImagePreview(reader.result as string);
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                className="hidden"
                            />
                        </div>
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
