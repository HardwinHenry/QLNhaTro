import crypto from "node:crypto";
import CauHinh from "../models/CauHinh.js";
import HoaDon from "../models/HoaDon.js";
import HopDong from "../models/HopDong.js";
import Phong from "../models/Phong.js";
import SePayTransaction from "../models/SePayTransaction.js";
import { resolveInvoiceStatus, syncOverdueInvoices, toPublicInvoiceStatus } from "../libs/sepayPayment.js";

function getCurrentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonth(monthInput) {
  const month = String(monthInput || "").trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return null;
  }
  return month;
}

function getMonthRange(month) {
  const [yearText, monthText] = month.split("-");
  const year = Number.parseInt(yearText, 10);
  const monthIndex = Number.parseInt(monthText, 10) - 1;
  const startDate = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

function getDueDateForMonth(month) {
  const [yearText, monthText] = month.split("-");
  const dueDayRaw = Number.parseInt(process.env.INVOICE_DUE_DAY || "5", 10);
  const dueDay = Number.isFinite(dueDayRaw) ? Math.min(28, Math.max(1, dueDayRaw)) : 5;

  const year = Number.parseInt(yearText, 10);
  const monthIndex = Number.parseInt(monthText, 10) - 1;
  // Due date is set to next month so newly created invoices are not immediately overdue.
  return new Date(year, monthIndex + 1, dueDay, 23, 59, 59, 999);
}

function normalizeCodePart(rawValue) {
  return String(rawValue || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

async function generateUniquePaymentCode(room, month) {
  const monthToken = month.replace("-", "");
  const prefix = normalizeCodePart(process.env.SEPAY_PAYMENT_PREFIX || "TRO").slice(0, 4) || "TRO";
  const roomTokenSource = room?.idPhong || room?.tenPhong || room?._id || "ROOM";
  const roomToken = normalizeCodePart(roomTokenSource).slice(0, 4) || "RM";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const randomToken = crypto.randomBytes(2).toString("hex").toUpperCase().slice(0, 3);
    const paymentCode = `${prefix}${roomToken}${monthToken}${randomToken}`.slice(0, 20);

    // eslint-disable-next-line no-await-in-loop
    const exists = await HoaDon.exists({ maThanhToan: paymentCode });
    if (!exists) {
      return paymentCode;
    }
  }

  throw new Error("Không thể tạo payment code duy nhất. Vui lòng thử lại.");
}

function mapStatusQueryToInternal(rawStatus) {
  const status = String(rawStatus || "").trim().toLowerCase();
  if (!status) return "";

  if (status === "paid" || status === "da_thanh_toan") return "Da_Thanh_Toan";
  if (status === "overdue" || status === "qua_han") return "Qua_Han";
  if (status === "unpaid" || status === "chua_thanh_toan") return "Chua_Thanh_Toan";
  return "";
}

async function ensureInvoiceStatus(invoice) {
  if (!invoice) return invoice;

  const resolved = resolveInvoiceStatus(invoice);
  if (resolved !== invoice.trangThai) {
    invoice.trangThai = resolved;
    await invoice.save();
  }

  return invoice;
}

function parsePagination(rawPage, rawLimit) {
  const page = Math.max(1, Number.parseInt(rawPage || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(rawLimit || "20", 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function escapeCsvValue(value) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
    return `"${raw.replace(/"/g, "\"\"")}"`;
  }
  return raw;
}

export const generateInvoicesByMonth = async (req, res) => {
  try {
    const month = parseMonth(req.body?.month) || getCurrentMonthString();
    const { startDate, endDate } = getMonthRange(month);
    const dueDate = getDueDateForMonth(month);
    const now = new Date();

    const hopDongs = await HopDong.find({
      trangThai: { $ne: "Ket_Thuc" },
      ngayBatDau: { $lte: endDate },
      ngayKetThuc: { $gte: startDate }
    })
      .populate("idPhong")
      .populate("idKhach");

    const created = [];
    const skipped = [];

    for (const hopDong of hopDongs) {
      if (!hopDong.idPhong || !hopDong.idKhach) {
        skipped.push({
          hopDongId: hopDong._id,
          reason: "missing_references"
        });
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const existedInvoice = await HoaDon.findOne({
        idHopDong: hopDong._id,
        $or: [
          { thangThanhToan: month },
          { ngayThangNam: { $gte: startDate, $lte: endDate } }
        ]
      });

      if (existedInvoice) {
        skipped.push({
          hopDongId: hopDong._id,
          hoaDonId: existedInvoice._id,
          reason: "already_exists"
        });
        continue;
      }

      const amountDue = Math.max(0, Number(hopDong.giaThue || hopDong.idPhong.giaPhong || 0));
      const paymentCode = await generateUniquePaymentCode(hopDong.idPhong, month);
      const initialStatus = dueDate.getTime() < now.getTime() ? "Qua_Han" : "Chua_Thanh_Toan";

      const invoice = new HoaDon({
        idHopDong: hopDong._id,
        idKhach: hopDong.idKhach._id,
        idPhong: hopDong.idPhong._id,
        ngayThangNam: startDate,
        thangThanhToan: month,
        hanThanhToan: dueDate,
        maThanhToan: paymentCode,
        tienPhong: amountDue,
        chiSoDienCu: 0,
        chiSoDienMoi: 0,
        giaDien: 0,
        tienDien: 0,
        chiSoNuocCu: 0,
        chiSoNuocMoi: 0,
        giaNuoc: 0,
        tienNuoc: 0,
        tienDichVu: 0,
        tongTien: amountDue,
        soTienDaThanhToan: 0,
        trangThai: initialStatus
      });

      // eslint-disable-next-line no-await-in-loop
      await invoice.save();
      // eslint-disable-next-line no-await-in-loop
      await Phong.findByIdAndUpdate(hopDong.idPhong._id, { trangThaiThanhToan: initialStatus });

      created.push({
        hoaDonId: invoice._id,
        roomId: hopDong.idPhong._id,
        roomName: hopDong.idPhong.tenPhong,
        tenantId: hopDong.idKhach._id,
        tenantName: hopDong.idKhach.hoVaTen,
        amountDue: invoice.tongTien,
        paymentCode: invoice.maThanhToan
      });
    }

    return res.status(201).json({
      success: true,
      month,
      dueDate,
      createdCount: created.length,
      skippedCount: skipped.length,
      created,
      skipped
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getInvoiceStatusByCode = async (req, res) => {
  try {
    const paymentCode = normalizeCodePart(req.params?.code);
    if (!paymentCode) {
      return res.status(400).json({ message: "Payment code không hợp lệ." });
    }

    const invoice = await HoaDon.findOne({ maThanhToan: paymentCode }).select(
      "trangThai ngayThanhToan tongTien"
    );

    if (!invoice) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn." });
    }

    await ensureInvoiceStatus(invoice);

    return res.json({
      status: toPublicInvoiceStatus(invoice),
      paidAt: invoice.ngayThanhToan || null,
      amount: invoice.tongTien || 0
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPublicInvoiceByCode = async (req, res) => {
  try {
    const paymentCode = normalizeCodePart(req.params?.code);
    if (!paymentCode) {
      return res.status(400).json({ message: "Payment code không hợp lệ." });
    }

    const invoice = await HoaDon.findOne({ maThanhToan: paymentCode })
      .populate("idPhong", "tenPhong idPhong")
      .select("maThanhToan thangThanhToan hanThanhToan tongTien trangThai ngayThanhToan idPhong");

    if (!invoice) {
      return res.status(404).json({ message: "Không tìm thấy hóa đơn." });
    }

    await ensureInvoiceStatus(invoice);

    const cauHinh = await CauHinh.findOne().sort({ createdAt: -1 }).select(
      "nganHang soTaiKhoan chuTaiKhoan"
    );

    return res.json({
      paymentCode: invoice.maThanhToan,
      room: invoice.idPhong
        ? {
          id: invoice.idPhong._id,
          roomNumber: invoice.idPhong.idPhong,
          roomName: invoice.idPhong.tenPhong
        }
        : null,
      month: invoice.thangThanhToan || null,
      amountDue: invoice.tongTien || 0,
      dueDate: invoice.hanThanhToan || null,
      status: toPublicInvoiceStatus(invoice),
      paidAt: invoice.ngayThanhToan || null,
      bank: cauHinh
        ? {
          code: cauHinh.nganHang,
          accountNumber: cauHinh.soTaiKhoan,
          accountName: cauHinh.chuTaiKhoan
        }
        : null
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getInvoicesForLandlord = async (req, res) => {
  try {
    await syncOverdueInvoices();

    const month = req.query?.month ? parseMonth(req.query.month) : "";
    if (req.query?.month && !month) {
      return res.status(400).json({ message: "month phải theo định dạng YYYY-MM." });
    }

    const filter = {};
    if (month) filter.thangThanhToan = month;
    if (req.query?.roomId) filter.idPhong = req.query.roomId;
    if (req.query?.tenantId) filter.idKhach = req.query.tenantId;

    const internalStatus = mapStatusQueryToInternal(req.query?.status);
    if (req.query?.status && !internalStatus) {
      return res.status(400).json({ message: "status không hợp lệ." });
    }
    if (internalStatus) filter.trangThai = internalStatus;

    const { page, limit, skip } = parsePagination(req.query?.page, req.query?.limit);

    const [total, items] = await Promise.all([
      HoaDon.countDocuments(filter),
      HoaDon.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("idPhong", "tenPhong idPhong")
        .populate("idKhach", "hoVaTen sdt")
        .populate("idHopDong", "ngayBatDau ngayKetThuc giaThue")
        .lean()
    ]);

    const enrichedItems = items.map((invoice) => ({
      ...invoice,
      publicStatus: toPublicInvoiceStatus(invoice)
    }));

    return res.json({
      items: enrichedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPaymentsReport = async (req, res) => {
  try {
    await syncOverdueInvoices();

    const month = req.query?.month ? parseMonth(req.query.month) : getCurrentMonthString();
    if (!month) {
      return res.status(400).json({ message: "month phải theo định dạng YYYY-MM." });
    }

    const { startDate, endDate } = getMonthRange(month);

    const invoices = await HoaDon.find({ thangThanhToan: month })
      .populate("idPhong", "tenPhong idPhong")
      .populate("idKhach", "hoVaTen sdt")
      .lean();

    const transactions = await SePayTransaction.find({
      $or: [
        { transactionDate: { $gte: startDate, $lte: endDate } },
        { idHoaDon: { $in: invoices.map((invoice) => invoice._id) } }
      ]
    })
      .sort({ transactionDate: -1, createdAt: -1 })
      .populate({
        path: "idHoaDon",
        populate: [
          { path: "idPhong", select: "tenPhong idPhong" },
          { path: "idKhach", select: "hoVaTen sdt" }
        ]
      })
      .lean();

    const totalExpected = invoices.reduce((sum, invoice) => sum + Number(invoice.tongTien || 0), 0);
    const totalCollected = invoices.reduce((sum, invoice) => {
      if (invoice.trangThai === "Da_Thanh_Toan") {
        return sum + Number(invoice.soTienDaThanhToan || invoice.tongTien || 0);
      }
      return sum;
    }, 0);

    const paidCount = invoices.filter((invoice) => invoice.trangThai === "Da_Thanh_Toan").length;
    const overdueCount = invoices.filter((invoice) => resolveInvoiceStatus(invoice) === "Qua_Han").length;
    const unpaidCount = Math.max(0, invoices.length - paidCount - overdueCount);

    const perRoomBreakdown = invoices.map((invoice) => ({
      invoiceId: invoice._id,
      roomId: invoice.idPhong?._id || null,
      roomName: invoice.idPhong?.tenPhong || "N/A",
      roomNumber: invoice.idPhong?.idPhong || "",
      tenantId: invoice.idKhach?._id || null,
      tenantName: invoice.idKhach?.hoVaTen || "N/A",
      amountDue: Number(invoice.tongTien || 0),
      paidAmount: Number(invoice.soTienDaThanhToan || 0),
      paymentCode: invoice.maThanhToan || "",
      status: toPublicInvoiceStatus(invoice),
      paidAt: invoice.ngayThanhToan || null,
      dueDate: invoice.hanThanhToan || null
    }));

    return res.json({
      month,
      totalExpected,
      totalCollected,
      collectionRate: totalExpected > 0 ? Number(((totalCollected / totalExpected) * 100).toFixed(2)) : 0,
      paidCount,
      unpaidCount,
      overdueCount,
      perRoomBreakdown,
      transactions: transactions.map((tx) => ({
        id: tx._id,
        sepayId: tx.sepayId,
        paymentCode: tx.paymentCode,
        transferAmount: tx.transferAmount,
        transferType: tx.transferType,
        gateway: tx.gateway,
        referenceCode: tx.referenceCode,
        transactionDate: tx.transactionDate,
        result: tx.result,
        roomName: tx.idHoaDon?.idPhong?.tenPhong || "",
        tenantName: tx.idHoaDon?.idKhach?.hoVaTen || "",
        invoiceStatus: tx.idHoaDon ? toPublicInvoiceStatus(tx.idHoaDon) : ""
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const exportPaymentsCsv = async (req, res) => {
  try {
    const month = req.query?.month ? parseMonth(req.query.month) : getCurrentMonthString();
    if (!month) {
      return res.status(400).json({ message: "month phải theo định dạng YYYY-MM." });
    }

    const { startDate, endDate } = getMonthRange(month);
    const invoiceIds = await HoaDon.find({ thangThanhToan: month }).distinct("_id");

    const transactions = await SePayTransaction.find({
      $or: [
        { idHoaDon: { $in: invoiceIds } },
        { transactionDate: { $gte: startDate, $lte: endDate } }
      ]
    })
      .sort({ transactionDate: -1, createdAt: -1 })
      .populate({
        path: "idHoaDon",
        populate: [
          { path: "idPhong", select: "tenPhong idPhong" },
          { path: "idKhach", select: "hoVaTen" }
        ]
      })
      .lean();

    const headers = [
      "transaction_date",
      "sepay_id",
      "payment_code",
      "room",
      "tenant",
      "transfer_amount",
      "invoice_amount",
      "invoice_status",
      "result",
      "reference_code",
      "gateway",
      "content"
    ];

    const rows = transactions.map((tx) => {
      const invoiceAmount = tx.idHoaDon ? Number(tx.idHoaDon.tongTien || 0) : 0;
      const invoiceStatus = tx.idHoaDon ? toPublicInvoiceStatus(tx.idHoaDon) : "";
      const roomName = tx.idHoaDon?.idPhong?.tenPhong || "";
      const tenantName = tx.idHoaDon?.idKhach?.hoVaTen || "";

      return [
        tx.transactionDate ? new Date(tx.transactionDate).toISOString() : "",
        tx.sepayId,
        tx.paymentCode,
        roomName,
        tenantName,
        Number(tx.transferAmount || 0),
        invoiceAmount,
        invoiceStatus,
        tx.result,
        tx.referenceCode,
        tx.gateway,
        tx.content || tx.description || ""
      ]
        .map((value) => escapeCsvValue(value))
        .join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="payments-${month}.csv"`);

    return res.send(`\uFEFF${csvContent}`);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getRevenueStatistics = async (req, res) => {
  try {
    const year = req.query?.year || new Date().getFullYear().toString();
    const invoices = await HoaDon.find({
      trangThai: "Da_Thanh_Toan",
      thangThanhToan: { $regex: `^${year}-` }
    }).lean();

    const monthlyRevenue = Array(12).fill(0);
    let totalRevenue = 0;

    invoices.forEach((invoice) => {
      if (!invoice.thangThanhToan) return;
      const monthPart = invoice.thangThanhToan.split("-")[1];
      const monthIndex = Number.parseInt(monthPart, 10) - 1;
      const amount = Number(invoice.soTienDaThanhToan || invoice.tongTien || 0);

      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyRevenue[monthIndex] += amount;
        totalRevenue += amount;
      }
    });

    const revenueByMonth = monthlyRevenue.map((revenue, index) => ({
      month: `${year}-${String(index + 1).padStart(2, "0")}`,
      revenue
    }));

    return res.json({
      year,
      totalRevenue,
      revenueByMonth
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
