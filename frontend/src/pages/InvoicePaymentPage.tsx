import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, Clock, Copy, Loader2, TriangleAlert } from "lucide-react";
import Swal from "sweetalert2";
import { invoiceService, type InvoiceStatusResponse, type PublicInvoiceDetail } from "../services/invoiceService";
import { formatVi } from "../utils/dateFormatter";

const POLLING_INTERVAL_MS = 4000;

export default function InvoicePaymentPage() {
    const { code } = useParams();
    const paymentCode = String(code || "").trim().toUpperCase();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [invoice, setInvoice] = useState<PublicInvoiceDetail | null>(null);
    const [status, setStatus] = useState<InvoiceStatusResponse | null>(null);

    const qrUrl = useMemo(() => {
        if (!invoice?.bank) return "";
        return `https://qr.sepay.vn/img?acc=${encodeURIComponent(invoice.bank.accountNumber)}`
            + `&bank=${encodeURIComponent(invoice.bank.code)}`
            + `&amount=${encodeURIComponent(String(Math.max(0, Math.round(invoice.amountDue || 0))))}`
            + `&des=${encodeURIComponent(invoice.paymentCode)}`;
    }, [invoice]);

    useEffect(() => {
        let mounted = true;

        const fetchInvoice = async () => {
            if (!paymentCode) {
                setError("Mã hóa đơn không hợp lệ.");
                setLoading(false);
                return;
            }

            try {
                const [detail, statusData] = await Promise.all([
                    invoiceService.getPublicInvoiceByCode(paymentCode),
                    invoiceService.getInvoiceStatusByCode(paymentCode)
                ]);

                if (!mounted) return;

                setInvoice(detail);
                setStatus(statusData);
                setError("");
            } catch (requestError: any) {
                if (!mounted) return;
                setError(requestError?.response?.data?.message || "Không tải được thông tin hóa đơn.");
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchInvoice();

        return () => {
            mounted = false;
        };
    }, [paymentCode]);

    useEffect(() => {
        if (!paymentCode) return undefined;
        if (!status || status.status === "paid") return undefined;

        const timer = window.setInterval(async () => {
            try {
                const latestStatus = await invoiceService.getInvoiceStatusByCode(paymentCode);
                setStatus(latestStatus);
                setInvoice((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        status: latestStatus.status,
                        paidAt: latestStatus.paidAt
                    };
                });
            } catch (error) {
                // Silent polling failure, retry on next interval.
            }
        }, POLLING_INTERVAL_MS);

        return () => {
            window.clearInterval(timer);
        };
    }, [paymentCode, status]);

    const copyPaymentCode = async () => {
        try {
            await navigator.clipboard.writeText(paymentCode);
            Swal.fire({
                icon: "success",
                title: "Đã sao chép",
                text: "Mã thanh toán đã được sao chép."
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Không thể sao chép",
                text: "Vui lòng sao chép thủ công mã thanh toán."
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    if (error || !invoice || !status) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
                <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-slate-800 space-y-4">
                    <div className="flex items-center gap-3 text-red-600">
                        <TriangleAlert size={22} />
                        <h1 className="text-xl font-black">Không tìm thấy hóa đơn</h1>
                    </div>
                    <p className="text-sm text-slate-600">{error || "Dữ liệu hóa đơn không khả dụng."}</p>
                    <Link to="/invoices" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700">
                        <ArrowLeft size={16} />
                        Quay lại danh sách hóa đơn
                    </Link>
                </div>
            </div>
        );
    }

    const isPaid = status.status === "paid";
    const isOverdue = status.status === "overdue";
    const estimatedLateFee = Math.round((invoice.amountDue || 0) * 0.02);

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto space-y-6">
                <Link to="/invoices" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900">
                    <ArrowLeft size={16} />
                    Quay lại hóa đơn
                </Link>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 text-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Hóa đơn thanh toán</p>
                            <h1 className="text-2xl sm:text-3xl font-black mt-1">{invoice.room?.roomName || "Phòng"}</h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Tháng {invoice.month || "-"} • Hạn thanh toán {invoice.dueDate ? formatVi(invoice.dueDate) : "-"}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Số tiền</p>
                            <p className="text-2xl sm:text-3xl font-black text-blue-600">
                                {(invoice.amountDue || 0).toLocaleString("vi-VN")}đ
                            </p>
                        </div>
                    </div>

                    {isPaid && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
                            <CheckCircle2 className="text-emerald-600 mt-0.5" size={20} />
                            <div>
                                <p className="font-black text-emerald-700">Thanh toán thành công</p>
                                <p className="text-sm text-emerald-700/90">
                                    Hệ thống đã xác nhận giao dịch lúc {status.paidAt ? formatVi(status.paidAt) : "vừa xong"}.
                                </p>
                            </div>
                        </div>
                    )}

                    {!isPaid && (
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-6 items-start">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                                {qrUrl ? (
                                    <img src={qrUrl} alt="SePay QR" className="w-full max-w-[260px] mx-auto rounded-xl" />
                                ) : (
                                    <div className="text-sm text-slate-500 py-16">Chưa có cấu hình ngân hàng để tạo QR.</div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Mã thanh toán</span>
                                        <button
                                            onClick={copyPaymentCode}
                                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                                        >
                                            <Copy size={14} />
                                            Sao chép
                                        </button>
                                    </div>
                                    <p className="text-lg font-black text-slate-900 break-all">{invoice.paymentCode}</p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 text-sm">
                                    <p><span className="text-slate-500">Ngân hàng:</span> <span className="font-bold">{invoice.bank?.code || "-"}</span></p>
                                    <p><span className="text-slate-500">Số tài khoản:</span> <span className="font-bold">{invoice.bank?.accountNumber || "-"}</span></p>
                                    <p><span className="text-slate-500">Chủ tài khoản:</span> <span className="font-bold">{invoice.bank?.accountName || "-"}</span></p>
                                    <p><span className="text-slate-500">Số tiền:</span> <span className="font-bold text-blue-600">{(invoice.amountDue || 0).toLocaleString("vi-VN")}đ</span></p>
                                    <p><span className="text-slate-500">Nội dung CK:</span> <span className="font-bold break-all">{invoice.paymentCode}</span></p>
                                </div>

                                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex items-start gap-3">
                                    <Clock className="text-blue-600 mt-0.5" size={18} />
                                    <p className="text-sm text-blue-700">
                                        Vui lòng hoàn tất thanh toán trước hạn để nhé.
                                    </p>
                                </div>

                                {isOverdue && (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                                        <TriangleAlert className="text-red-600 mt-0.5" size={18} />
                                        <p className="text-sm text-red-700">
                                            Hóa đơn đã quá hạn. Có thể áp dụng phụ phí trễ hạn khoảng {estimatedLateFee.toLocaleString("vi-VN")}đ tùy quy định.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

