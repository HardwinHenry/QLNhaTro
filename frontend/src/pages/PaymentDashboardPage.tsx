import { useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Download, FileClock, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import Swal from "sweetalert2";
import { invoiceService, type PaymentReportResponse } from "../services/invoiceService";
import { useAuthStore } from "../store/authStore";
import { formatVi } from "../utils/dateFormatter";

function getDefaultMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getStatusBadgeClass(status: string) {
    if (status === "paid") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "overdue") return "bg-red-100 text-red-700 border-red-200";
    return "bg-amber-100 text-amber-700 border-amber-200";
}

function getStatusLabel(status: string) {
    if (status === "paid") return "Đã thanh toán";
    if (status === "overdue") return "Quá hạn";
    return "Chờ thanh toán";
}

export default function PaymentDashboardPage() {
    const { user } = useAuthStore();
    const [month, setMonth] = useState(getDefaultMonth());
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<PaymentReportResponse | null>(null);
    const [transactionSearch, setTransactionSearch] = useState("");

    const isLandlord = user?.vaiTro === "Chu_Tro";

    const loadReport = async (targetMonth: string) => {
        try {
            setLoading(true);
            const data = await invoiceService.getPaymentsReport(targetMonth);
            setReport(data);
        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Không tải được báo cáo",
                text: error?.response?.data?.message || "Đã có lỗi xảy ra khi tải dữ liệu thanh toán."
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isLandlord) return;
        loadReport(month);
    }, [month, isLandlord]);

    const handleGenerateInvoices = async () => {
        const confirm = await Swal.fire({
            icon: "question",
            title: "Tạo hóa đơn tháng này?",
            text: `Hệ thống sẽ tạo hóa đơn cho tháng ${month} và bỏ qua các phòng đã có hóa đơn.`,
            showCancelButton: true,
            confirmButtonText: "Tạo hóa đơn",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#2563eb"
        });

        if (!confirm.isConfirmed) return;

        try {
            const result = await invoiceService.generateInvoices(month);
            await Swal.fire({
                icon: "success",
                title: "Đã tạo hóa đơn",
                html: `Đã tạo <b>${result.createdCount}</b> hóa đơn, bỏ qua <b>${result.skippedCount}</b> hóa đơn đã tồn tại.`
            });
            loadReport(month);
        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Tạo hóa đơn thất bại",
                text: error?.response?.data?.message || "Không thể tạo hóa đơn tự động."
            });
        }
    };

    const handleExportCsv = async () => {
        try {
            const csvBlob = await invoiceService.exportPaymentsCsv(month);
            const blobUrl = window.URL.createObjectURL(csvBlob);
            const anchor = document.createElement("a");
            anchor.href = blobUrl;
            anchor.download = `payments-${month}.csv`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Xuất CSV thất bại",
                text: error?.response?.data?.message || "Không thể xuất file CSV."
            });
        }
    };

    const filteredTransactions = useMemo(() => {
        if (!report) return [];
        const keyword = transactionSearch.trim().toLowerCase();
        if (!keyword) return report.transactions;

        return report.transactions.filter((tx) =>
            tx.roomName.toLowerCase().includes(keyword)
            || tx.tenantName.toLowerCase().includes(keyword)
            || tx.sepayId.toLowerCase().includes(keyword)
            || tx.referenceCode.toLowerCase().includes(keyword)
            || tx.paymentCode.toLowerCase().includes(keyword)
        );
    }, [report, transactionSearch]);

    if (!isLandlord) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
                <p className="text-slate-500 font-bold">Bạn không có quyền truy cập màn hình này.</p>
            </div>
        );
    }

    if (loading && !report) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-blue-600" size={42} />
            </div>
        );
    }

    return (
        <div className="space-y-6 text-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                            <BarChart3 size={22} />
                        </span>
                        Dashboard Thanh Toán
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Tổng hợp thu tiền phòng theo tháng và lịch sử giao dịch SePay.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm"
                    />
                    <button
                        onClick={() => loadReport(month)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold hover:bg-slate-50"
                    >
                        <RefreshCw size={16} />
                        Làm mới
                    </button>
                    <button
                        onClick={handleGenerateInvoices}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700"
                    >
                        <FileClock size={16} />
                        Generate Invoices
                    </button>
                    <button
                        onClick={handleExportCsv}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Expected</p>
                    <p className="text-2xl font-black text-slate-900 mt-2">{(report?.totalExpected || 0).toLocaleString("vi-VN")}đ</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Collected</p>
                    <p className="text-2xl font-black text-emerald-600 mt-2">{(report?.totalCollected || 0).toLocaleString("vi-VN")}đ</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Collection Rate</p>
                    <p className="text-2xl font-black text-blue-600 mt-2">{(report?.collectionRate || 0).toFixed(2)}%</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Overdue</p>
                    <p className="text-2xl font-black text-red-600 mt-2">{report?.overdueCount || 0}</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                    <h2 className="text-lg font-black">Trạng thái theo phòng</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                        <thead className="bg-slate-50">
                            <tr className="text-xs text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-3 font-black">Phòng</th>
                                <th className="px-6 py-3 font-black">Khách thuê</th>
                                <th className="px-6 py-3 font-black">Số tiền</th>
                                <th className="px-6 py-3 font-black">Trạng thái</th>
                                <th className="px-6 py-3 font-black">Paid At</th>
                                <th className="px-6 py-3 font-black">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(report?.perRoomBreakdown || []).map((item) => (
                                <tr key={item.invoiceId} className="hover:bg-slate-50/60">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800">{item.roomName}</p>
                                        <p className="text-xs text-slate-400">#{item.roomNumber || "N/A"}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-700">{item.tenantName}</p>
                                    </td>
                                    <td className="px-6 py-4 font-black text-blue-600">
                                        {item.amountDue.toLocaleString("vi-VN")}đ
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black ${getStatusBadgeClass(item.status)}`}>
                                            {item.status === "paid" ? <CheckCircle2 size={12} /> : <TriangleAlert size={12} />}
                                            {getStatusLabel(item.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {item.paidAt ? formatVi(item.paidAt) : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 font-bold">
                                        {item.paymentCode || "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-lg font-black">Transaction History</h2>
                    <input
                        type="text"
                        value={transactionSearch}
                        onChange={(e) => setTransactionSearch(e.target.value)}
                        placeholder="Lọc theo phòng, khách, mã giao dịch..."
                        className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px] text-left">
                        <thead className="bg-slate-50">
                            <tr className="text-xs text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-3 font-black">Date</th>
                                <th className="px-6 py-3 font-black">Room</th>
                                <th className="px-6 py-3 font-black">Tenant</th>
                                <th className="px-6 py-3 font-black">Amount</th>
                                <th className="px-6 py-3 font-black">Bank Ref</th>
                                <th className="px-6 py-3 font-black">SePay ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                                        Không có giao dịch khớp bộ lọc.
                                    </td>
                                </tr>
                            )}
                            {filteredTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50/60">
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {tx.transactionDate ? formatVi(tx.transactionDate) : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{tx.roomName || "-"}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{tx.tenantName || "-"}</td>
                                    <td className="px-6 py-4 text-sm font-black text-blue-600">{(tx.transferAmount || 0).toLocaleString("vi-VN")}đ</td>
                                    <td className="px-6 py-4 text-xs text-slate-500 font-bold">{tx.referenceCode || "-"}</td>
                                    <td className="px-6 py-4 text-xs text-slate-500 font-bold">{tx.sepayId}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

