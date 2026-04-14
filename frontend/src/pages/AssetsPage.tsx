import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Package, Loader2 } from "lucide-react";
import { vatTuService, type VatTu } from "../services/vatTuService";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

export default function AssetsPage() {
    const [assets, setAssets] = useState<VatTu[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<VatTu | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, reset, setValue } = useForm<Partial<VatTu>>();

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const data = await vatTuService.getAllVatTus();
            setAssets(data);
        } catch (error) {
            toast.error("Không thể tải danh sách vật tư");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: Partial<VatTu>) => {
        setSubmitting(true);
        try {
            if (editingAsset) {
                await vatTuService.updateVatTu(editingAsset._id, data);
                toast.success("Cập nhật vật tư thành công");
            } else {
                await vatTuService.createVatTu(data);
                toast.success("Thêm vật tư mới thành công");
            }
            setIsModalOpen(false);
            fetchAssets();
            reset();
            setEditingAsset(null);
        } catch (error) {
            toast.error("Lỗi khi lưu vật tư");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (asset: VatTu) => {
        setEditingAsset(asset);
        setValue("tenVatTu", asset.tenVatTu);
        setValue("donGia", asset.donGia);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa vật tư này?")) return;
        try {
            await vatTuService.deleteVatTu(id);
            toast.success("Đã xóa vật tư");
            fetchAssets();
        } catch (error) {
            toast.error("Lỗi khi xóa vật tư");
        }
    };

    const filteredAssets = assets.filter(a => 
        a.tenVatTu.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý vật tư</h1>
                    <p className="text-slate-500 text-sm">Quản lý danh mục trang thiết bị, vật dụng dùng chung</p>
                </div>
                <button
                    onClick={() => {
                        setEditingAsset(null);
                        reset();
                        setIsModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200 font-medium"
                >
                    <Plus size={18} />
                    Thêm vật tư
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm vật tư..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Tên vật tư</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">Đơn giá (VNĐ)</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-1/2"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-1/4 ml-auto"></div></td>
                                        <td className="px-6 py-4 text-center"><div className="h-8 bg-slate-100 rounded-lg w-20 mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredAssets.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                                        <Package size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>Không tìm thấy vật tư nào</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredAssets.map((asset) => (
                                    <tr key={asset._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-700">{asset.tenVatTu}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-semibold text-blue-600">
                                                {asset.donGia.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(asset)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Sửa"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(asset._id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900">
                                {editingAsset ? "Cập nhật vật tư" : "Thêm vật tư mới"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên vật tư</label>
                                <input
                                    {...register("tenVatTu", { required: true })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Vd: Máy lạnh Inverter"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Đơn giá (VNĐ)</label>
                                <input
                                    type="number"
                                    {...register("donGia", { required: true, min: 0 })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="0"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-blue-600 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2"
                                >
                                    {submitting && <Loader2 size={18} className="animate-spin" />}
                                    {editingAsset ? "Lưu thay đổi" : "Thêm mới"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
