import { useState, useEffect } from "react";
import { X, Loader2, Upload, Trash2 } from "lucide-react";
import { dayPhongService, type DayPhong } from "../services/dayPhongService";
import { toast } from "sonner";

interface DayPhongFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingDayPhong: DayPhong | null;
}

export default function DayPhongFormModal({ isOpen, onClose, onSuccess, editingDayPhong }: DayPhongFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        soDay: "A",
        tang: 1,
        viTri: "",
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (editingDayPhong) {
            setFormData({
                soDay: editingDayPhong.soDay,
                tang: editingDayPhong.tang,
                viTri: editingDayPhong.viTri,
            });
            // @ts-ignore
            setImagePreview(editingDayPhong.hinhAnh ? `http://localhost:5001${editingDayPhong.hinhAnh}` : null);
        } else {
            setFormData({
                soDay: "A",
                tang: 1,
                viTri: "",
            });
            setImageFile(null);
            setImagePreview(null);
        }
    }, [editingDayPhong, isOpen]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append("soDay", formData.soDay.toString());
            data.append("tang", formData.tang.toString());
            data.append("viTri", formData.viTri);
            if (imageFile) {
                data.append("hinhAnh", imageFile);
            }

            if (editingDayPhong) {
                await dayPhongService.updateDayPhong(editingDayPhong._id, data);
                toast.success("Cập nhật dãy/tầng thành công");
            } else {
                await dayPhongService.createDayPhong(data);
                toast.success("Thêm dãy/tầng thành công");
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between ">
                    <h2 className="text-xl font-bold text-slate-800">
                        {editingDayPhong ? "Chỉnh sửa dãy/tầng" : "Thêm dãy/tầng mới"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số dãy / Tên dãy</label>
                            <input
                                type="text"
                                required
                                value={formData.soDay}
                                onChange={e => setFormData({ ...formData, soDay: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                placeholder="Ví dụ: A"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tầng</label>
                            <input
                                type="number"
                                required
                                value={formData.tang}
                                onChange={e => setFormData({ ...formData, tang: Number(e.target.value) })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                placeholder="Ví dụ: 1"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vị trí / Mô tả</label>
                        <input
                            type="text"
                            required
                            value={formData.viTri}
                            onChange={e => setFormData({ ...formData, viTri: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            placeholder="Ví dụ: Dãy A - Tầng 1"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hình ảnh đại diện</label>
                        {imagePreview ? (
                            <div className="relative w-full h-48 rounded-2xl overflow-hidden group border border-slate-200">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('image-upload')?.click()}
                                        className="p-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-all font-bold text-xs flex items-center gap-2"
                                    >
                                        <Upload size={14} /> Thay đổi
                                    </button>
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all font-bold text-xs flex items-center gap-2"
                                    >
                                        <Trash2 size={14} /> Gỡ bỏ
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => document.getElementById('image-upload')?.click()}
                                className="w-full h-48 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all"
                            >
                                <div className="p-3 bg-slate-50 rounded-full group-hover:bg-blue-100">
                                    <Upload size={24} />
                                </div>
                                <span className="text-sm font-bold">Tải lên hình ảnh dãy/tầng</span>
                            </button>
                        )}
                        <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-4 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (editingDayPhong ? "Cập nhật" : "Thêm ngay")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
