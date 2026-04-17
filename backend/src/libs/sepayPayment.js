import HoaDon from "../models/HoaDon.js";
import HopDong from "../models/HopDong.js";
import Phong from "../models/Phong.js";
import SePayTransaction from "../models/SePayTransaction.js";
import ThanhToan from "../models/ThanhToan.js";

export const SEPAY_RESULTS = Object.freeze({
  SUCCESS: "success",
  DUPLICATE: "duplicate",
  UNMATCHED_CODE: "unmatched_code",
  AMOUNT_MISMATCH: "amount_mismatch",
  WRONG_DIRECTION: "wrong_direction",
  ALREADY_PAID: "already_paid",
  FAILED: "failed"
});

const PUBLIC_STATUS_MAP = Object.freeze({
  Da_Thanh_Toan: "paid",
  Qua_Han: "overdue",
  Chua_Thanh_Toan: "unpaid"
});

function toSafeNumber(rawValue) {
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePaymentCode(code) {
  if (typeof code !== "string") return "";
  return String(code)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function normalizeSePayId(rawId) {
  if (typeof rawId === "number" && Number.isFinite(rawId)) {
    return String(Math.trunc(rawId));
  }

  if (typeof rawId === "string") {
    return rawId.trim();
  }

  return "";
}

export function parseSePayTransactionDate(rawValue) {
  if (!rawValue) return null;

  if (rawValue instanceof Date && !Number.isNaN(rawValue.getTime())) {
    return rawValue;
  }

  const value = String(rawValue).trim();
  if (!value) return null;

  const matched = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
  );

  if (matched) {
    const year = Number.parseInt(matched[1], 10);
    const month = Number.parseInt(matched[2], 10) - 1;
    const day = Number.parseInt(matched[3], 10);
    const hour = Number.parseInt(matched[4], 10);
    const minute = Number.parseInt(matched[5], 10);
    const second = Number.parseInt(matched[6] || "0", 10);

    const date = new Date(year, month, day, hour, minute, second);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeTransferType(rawType) {
  return String(rawType || "").trim().toLowerCase();
}

function getStringValue(rawValue) {
  return typeof rawValue === "string" ? rawValue.trim() : "";
}

function getPaymentCodeCandidatesFromContent(content) {
  const normalized = String(content || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, " ");

  const tokens = normalized
    .split(/\s+/)
    .map(normalizePaymentCode)
    .filter((token) => token.length >= 6 && token.length <= 20);

  if (tokens.length === 0) return [];

  const uniqueTokens = [...new Set(tokens)];
  const prefix = normalizePaymentCode(process.env.SEPAY_PAYMENT_PREFIX || "TRO").slice(0, 4);

  return uniqueTokens.sort((a, b) => {
    const aHasPrefix = prefix && a.startsWith(prefix);
    const bHasPrefix = prefix && b.startsWith(prefix);
    if (aHasPrefix && !bHasPrefix) return -1;
    if (!aHasPrefix && bHasPrefix) return 1;
    return b.length - a.length;
  });
}

function parsePayload(payload) {
  const sepayId = normalizeSePayId(payload?.id);
  const transferType = normalizeTransferType(payload?.transferType);
  const transferAmount = toSafeNumber(payload?.transferAmount);

  return {
    sepayId,
    gateway: getStringValue(payload?.gateway),
    transactionDate: parseSePayTransactionDate(payload?.transactionDate),
    accountNumber: getStringValue(payload?.accountNumber),
    paymentCode: normalizePaymentCode(payload?.code),
    content: getStringValue(payload?.content),
    transferType,
    transferAmount,
    accumulated: toSafeNumber(payload?.accumulated),
    referenceCode: getStringValue(payload?.referenceCode),
    description: getStringValue(payload?.description),
    rawPayload: payload && typeof payload === "object" ? payload : {}
  };
}

function validatePayloadShape(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Payload webhook không hợp lệ.";
  }

  const sepayId = normalizeSePayId(payload.id);
  if (!sepayId) {
    return "Thiếu trường id từ SePay.";
  }

  if (typeof payload.transferType !== "string") {
    return "transferType phải là chuỗi.";
  }

  if (!["in", "out"].includes(payload.transferType.trim().toLowerCase())) {
    return "transferType không hợp lệ.";
  }

  if (!Number.isFinite(Number(payload.transferAmount))) {
    return "transferAmount phải là số.";
  }

  if (payload.code !== null && payload.code !== undefined && typeof payload.code !== "string") {
    return "code phải là chuỗi hoặc null.";
  }

  return "";
}

export function resolveInvoiceStatus(invoice, now = new Date()) {
  if (!invoice) return "Chua_Thanh_Toan";
  if (invoice.trangThai === "Da_Thanh_Toan") return "Da_Thanh_Toan";

  const dueDate = invoice.hanThanhToan ? new Date(invoice.hanThanhToan) : null;
  if (dueDate && !Number.isNaN(dueDate.getTime()) && dueDate.getTime() < now.getTime()) {
    return "Qua_Han";
  }

  return "Chua_Thanh_Toan";
}

export function toPublicInvoiceStatus(invoice) {
  const internalStatus = resolveInvoiceStatus(invoice);
  return PUBLIC_STATUS_MAP[internalStatus] || "unpaid";
}

async function hydrateInvoiceReferences(invoice) {
  if (!invoice) return invoice;

  if (invoice.idPhong && invoice.idKhach) {
    return invoice;
  }

  if (!invoice.idHopDong) {
    return invoice;
  }

  const hopDong = await HopDong.findById(invoice.idHopDong).select("idPhong idKhach").lean();
  if (!hopDong) {
    return invoice;
  }

  const shouldUpdate =
    (!invoice.idPhong && hopDong.idPhong) ||
    (!invoice.idKhach && hopDong.idKhach);

  if (!shouldUpdate) {
    return invoice;
  }

  if (!invoice.idPhong && hopDong.idPhong) {
    invoice.idPhong = hopDong.idPhong;
  }

  if (!invoice.idKhach && hopDong.idKhach) {
    invoice.idKhach = hopDong.idKhach;
  }

  await invoice.save();
  return invoice;
}

async function updateRoomPaymentStatus(invoice, forcedStatus) {
  if (!invoice) return;

  await hydrateInvoiceReferences(invoice);
  if (!invoice.idPhong) return;

  const status = forcedStatus || resolveInvoiceStatus(invoice);
  await Phong.findByIdAndUpdate(invoice.idPhong, { trangThaiThanhToan: status });
}

function getProcessingStateFromResult(result) {
  if (result === SEPAY_RESULTS.SUCCESS || result === SEPAY_RESULTS.ALREADY_PAID) {
    return "processed";
  }

  if (result === SEPAY_RESULTS.WRONG_DIRECTION) {
    return "ignored";
  }

  if (
    result === SEPAY_RESULTS.UNMATCHED_CODE ||
    result === SEPAY_RESULTS.AMOUNT_MISMATCH
  ) {
    return "unmatched";
  }

  if (result === SEPAY_RESULTS.DUPLICATE) {
    return "processed";
  }

  return "failed";
}

async function finalizeTransaction(transaction, updates) {
  if (!transaction) return null;

  Object.assign(transaction, updates, {
    handledAt: new Date(),
    processingState: getProcessingStateFromResult(updates.result)
  });

  await transaction.save();
  return transaction;
}

export async function processSePayPayload(payload, options = {}) {
  const source = options.source || "webhook";

  try {
    const sepayId = normalizeSePayId(payload?.id);
    if (!sepayId) {
      return {
        result: SEPAY_RESULTS.FAILED,
        message: "Thiếu trường id từ SePay.",
        sepayId,
        source,
        retryable: false
      };
    }

    const existing = await SePayTransaction.findOne({ sepayId });
    if (existing) {
      return {
        result: SEPAY_RESULTS.DUPLICATE,
        message: "Giao dịch đã tồn tại, bỏ qua xử lý trùng.",
        sepayId,
        source,
        retryable: false
      };
    }

    const validationError = validatePayloadShape(payload);
    if (validationError) {
      try {
        await SePayTransaction.create({
          sepayId,
          payload: payload && typeof payload === "object" ? payload : {},
          result: SEPAY_RESULTS.FAILED,
          processingState: "failed",
          lastError: validationError
        });
      } catch (error) {
        if (error?.code === 11000) {
          return {
            result: SEPAY_RESULTS.DUPLICATE,
            message: "Giao dịch đã tồn tại, bỏ qua xử lý trùng.",
            sepayId,
            source,
            retryable: false
          };
        }
        throw error;
      }

      return {
        result: SEPAY_RESULTS.FAILED,
        message: validationError,
        sepayId,
        source,
        retryable: false
      };
    }

    const parsed = parsePayload(payload);

    const transaction = await SePayTransaction.create({
      sepayId: parsed.sepayId,
      gateway: parsed.gateway,
      transactionDate: parsed.transactionDate,
      accountNumber: parsed.accountNumber,
      paymentCode: parsed.paymentCode,
      content: parsed.content,
      transferType: parsed.transferType,
      transferAmount: parsed.transferAmount,
      accumulated: parsed.accumulated,
      referenceCode: parsed.referenceCode,
      description: parsed.description,
      payload: parsed.rawPayload,
      result: "processing",
      processingState: "received"
    });

    if (parsed.transferType !== "in") {
      await finalizeTransaction(transaction, {
        result: SEPAY_RESULTS.WRONG_DIRECTION,
        lastError: "Giao dịch không phải chiều tiền vào."
      });

      return {
        result: SEPAY_RESULTS.WRONG_DIRECTION,
        message: "transferType phải là \"in\".",
        sepayId: parsed.sepayId,
        source,
        retryable: false
      };
    }

    let invoice = null;
    if (parsed.paymentCode) {
      invoice = await HoaDon.findOne({ maThanhToan: parsed.paymentCode });
    } else {
      const codeCandidates = getPaymentCodeCandidatesFromContent(parsed.content);
      if (codeCandidates.length > 0) {
        invoice = await HoaDon.findOne({ maThanhToan: { $in: codeCandidates } });
        if (invoice?.maThanhToan) {
          parsed.paymentCode = normalizePaymentCode(invoice.maThanhToan);
        }
      }
    }

    if (!parsed.paymentCode) {
      await finalizeTransaction(transaction, {
        result: SEPAY_RESULTS.UNMATCHED_CODE,
        lastError: "Không tìm thấy payment code."
      });

      return {
        result: SEPAY_RESULTS.UNMATCHED_CODE,
        message: "Thiếu payment code trong payload SePay.",
        sepayId: parsed.sepayId,
        source,
        retryable: false
      };
    }

    if (!invoice) {
      await finalizeTransaction(transaction, {
        result: SEPAY_RESULTS.UNMATCHED_CODE,
        paymentCode: parsed.paymentCode,
        lastError: "Không tìm thấy hóa đơn khớp payment code."
      });

      return {
        result: SEPAY_RESULTS.UNMATCHED_CODE,
        message: "Không có hóa đơn nào khớp payment code.",
        sepayId: parsed.sepayId,
        source,
        retryable: false
      };
    }

    const expectedAmount = toSafeNumber(invoice.tongTien);
    const amountDelta = parsed.transferAmount - expectedAmount;

    if (parsed.transferAmount < expectedAmount) {
      await finalizeTransaction(transaction, {
        idHoaDon: invoice._id,
        expectedAmount,
        amountDelta,
        paymentCode: parsed.paymentCode,
        result: SEPAY_RESULTS.AMOUNT_MISMATCH,
        lastError: "Số tiền chuyển thấp hơn số tiền hóa đơn."
      });

      await updateRoomPaymentStatus(invoice);

      return {
        result: SEPAY_RESULTS.AMOUNT_MISMATCH,
        message: "Số tiền chuyển thấp hơn số tiền cần thanh toán.",
        sepayId: parsed.sepayId,
        source,
        retryable: false
      };
    }

    const resolvedInvoiceStatus = resolveInvoiceStatus(invoice);
    if (invoice.trangThai !== resolvedInvoiceStatus) {
      invoice.trangThai = resolvedInvoiceStatus;
      await invoice.save();
    }

    if (invoice.trangThai === "Da_Thanh_Toan") {
      await finalizeTransaction(transaction, {
        idHoaDon: invoice._id,
        expectedAmount,
        amountDelta,
        paymentCode: parsed.paymentCode,
        result: SEPAY_RESULTS.ALREADY_PAID,
        lastError: "Hóa đơn đã được thanh toán trước đó."
      });

      await updateRoomPaymentStatus(invoice, "Da_Thanh_Toan");

      return {
        result: SEPAY_RESULTS.ALREADY_PAID,
        message: "Hóa đơn đã thanh toán trước đó.",
        sepayId: parsed.sepayId,
        source,
        retryable: false
      };
    }

    const paidAt = parsed.transactionDate || new Date();

    invoice.trangThai = "Da_Thanh_Toan";
    invoice.ngayThanhToan = paidAt;
    invoice.soTienDaThanhToan = parsed.transferAmount;
    invoice.sepayTransactionId = parsed.sepayId;
    invoice.maThamChieuNganHang = parsed.referenceCode;

    await hydrateInvoiceReferences(invoice);
    await invoice.save();

    await ThanhToan.findOneAndUpdate(
      { idHoaDon: invoice._id },
      {
        idHoaDon: invoice._id,
        ngayThanhToan: paidAt,
        phuongThuc: "SePay",
        soTien: parsed.transferAmount,
        maGiaoDich: parsed.sepayId,
        maThamChieuNganHang: parsed.referenceCode
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await updateRoomPaymentStatus(invoice, "Da_Thanh_Toan");

    await finalizeTransaction(transaction, {
      idHoaDon: invoice._id,
      expectedAmount,
      amountDelta,
      paymentCode: parsed.paymentCode,
      result: SEPAY_RESULTS.SUCCESS,
      lastError: ""
    });

    return {
      result: SEPAY_RESULTS.SUCCESS,
      message: "Đã xác nhận thanh toán thành công.",
      sepayId: parsed.sepayId,
      invoiceId: invoice._id,
      source,
      retryable: false
    };
  } catch (error) {
    return {
      result: SEPAY_RESULTS.FAILED,
      message: error?.message || "Lỗi không xác định khi xử lý giao dịch SePay.",
      sepayId: normalizeSePayId(payload?.id),
      source,
      retryable: true
    };
  }
}

export async function syncOverdueInvoices(now = new Date()) {
  await HoaDon.updateMany(
    {
      trangThai: { $ne: "Da_Thanh_Toan" },
      hanThanhToan: { $lt: now }
    },
    { $set: { trangThai: "Qua_Han" } }
  );

  const overdueInvoices = await HoaDon.find(
    { trangThai: "Qua_Han" },
    { idPhong: 1, idHopDong: 1 }
  );

  const overdueRoomIds = [];
  for (const invoice of overdueInvoices) {
    const hydratedInvoice = await hydrateInvoiceReferences(invoice);
    if (hydratedInvoice?.idPhong) {
      overdueRoomIds.push(hydratedInvoice.idPhong);
    }
  }

  if (overdueRoomIds.length > 0) {
    await Phong.updateMany(
      { _id: { $in: overdueRoomIds } },
      { $set: { trangThaiThanhToan: "Qua_Han" } }
    );
  }
}
