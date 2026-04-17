import crypto from "node:crypto";
import HoaDon from "../models/HoaDon.js";
import SePayTransaction from "../models/SePayTransaction.js";

const PAYMENT_CODE_REGEXES = [
  /\bHD[:\s_-]*([a-fA-F0-9]{24})\b/i,
  /\bHOADON[:\s_-]*([a-fA-F0-9]{24})\b/i,
  /\bINV(?:OICE)?[:\s_-]*([a-fA-F0-9]{24})\b/i
];

const terminalStates = new Set(["processed", "ignored", "unmatched"]);
const rateLimitBuckets = new Map();
const RATE_LIMIT_CLEANUP_THRESHOLD = 5000;

function parseIntEnv(name, fallback) {
  const parsed = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

function normalizeIp(ip) {
  return String(ip || "")
    .trim()
    .replace(/^::ffff:/, "");
}

function extractAuthToken(req) {
  const headerCandidates = [
    req.headers.authorization,
    req.headers["x-sepay-token"],
    req.headers["x-api-key"]
  ];

  for (const rawHeader of headerCandidates) {
    if (typeof rawHeader !== "string") continue;
    const trimmed = rawHeader.trim();
    if (!trimmed) continue;

    return trimmed
      .replace(/^Bearer\s+/i, "")
      .replace(/^ApiKey\s+/i, "")
      .trim();
  }

  return "";
}

function secureCompare(received, expected) {
  const receivedBuffer = Buffer.from(received || "", "utf8");
  const expectedBuffer = Buffer.from(expected || "", "utf8");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

function getAllowedIps() {
  return (process.env.SEPAY_ALLOWED_IPS || "")
    .split(",")
    .map((entry) => normalizeIp(entry))
    .filter(Boolean);
}

function parseTransferAmount(rawAmount) {
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Math.round(amount));
}

function parseDateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function parseInvoiceIdFromContent(content) {
  const normalizedContent = String(content || "").trim();
  if (!normalizedContent) return null;

  for (const regex of PAYMENT_CODE_REGEXES) {
    const matched = normalizedContent.match(regex);
    if (matched?.[1]) {
      return matched[1];
    }
  }

  return null;
}

function buildTransactionBase(payload) {
  return {
    transferType: String(payload.transferType || "").toLowerCase(),
    transferAmount: parseTransferAmount(payload.transferAmount ?? payload.amount),
    content: String(payload.content || payload.description || ""),
    accountNumber: String(payload.accountNumber || ""),
    gateway: String(payload.gateway || payload.bankName || ""),
    referenceCode: String(payload.referenceCode || payload.code || ""),
    transactionDate: parseDateOrNull(payload.transactionDate || payload.transactionTime)
  };
}

async function resetTransactionForAttempt(transaction, baseData, payload, now) {
  transaction.transferType = baseData.transferType;
  transaction.transferAmount = baseData.transferAmount;
  transaction.content = baseData.content;
  transaction.accountNumber = baseData.accountNumber;
  transaction.gateway = baseData.gateway;
  transaction.referenceCode = baseData.referenceCode;
  transaction.transactionDate = baseData.transactionDate;
  transaction.result = "received";
  transaction.processingState = "received";
  transaction.payload = payload;
  transaction.lastReceivedAt = now;
  transaction.lastError = "";
  transaction.attemptCount = (transaction.attemptCount || 0) + 1;
  await transaction.save();
}

async function markTransactionResult(transaction, updates) {
  Object.assign(transaction, updates, {
    handledAt: updates.handledAt || new Date()
  });
  await transaction.save();
}

export const sepayRateLimit = (req, res, next) => {
  const windowMs = parseIntEnv("SEPAY_RATE_LIMIT_WINDOW_MS", 60_000);
  const maxRequests = parseIntEnv("SEPAY_RATE_LIMIT_MAX", 120);
  const now = Date.now();
  const ip = normalizeIp(getClientIp(req));
  const key = ip || "unknown";

  const bucket = rateLimitBuckets.get(key);
  if (!bucket || now - bucket.windowStart > windowMs) {
    rateLimitBuckets.set(key, { windowStart: now, count: 1 });
  } else {
    bucket.count += 1;
    if (bucket.count > maxRequests) {
      return res.status(429).json({ success: false, error: "Too many requests" });
    }
  }

  if (rateLimitBuckets.size > RATE_LIMIT_CLEANUP_THRESHOLD) {
    for (const [bucketKey, bucketValue] of rateLimitBuckets.entries()) {
      if (now - bucketValue.windowStart > windowMs * 2) {
        rateLimitBuckets.delete(bucketKey);
      }
    }
  }

  return next();
};

export const handleSePayWebhook = async (req, res) => {
  let transaction = null;

  try {
    const configuredToken = String(process.env.SEPAY_TOKEN || "").trim();
    if (!configuredToken) {
      console.error("[SePay] Missing SEPAY_TOKEN in environment.");
      return res.status(500).json({ success: false, error: "Webhook not configured" });
    }

    const receivedToken = extractAuthToken(req);
    if (!secureCompare(receivedToken, configuredToken)) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const allowedIps = getAllowedIps();
    const requesterIp = normalizeIp(getClientIp(req));
    if (allowedIps.length > 0 && !allowedIps.includes(requesterIp)) {
      return res.status(401).json({ success: false, error: "Unauthorized IP" });
    }

    const payload = req.body && typeof req.body === "object" ? req.body : {};
    const sepayId = String(payload.id ?? payload.transactionId ?? "").trim();
    if (!sepayId) {
      console.warn("[SePay] Missing transaction id in payload.");
      return res.status(200).json({ success: true, ignored: true });
    }

    const now = new Date();
    const baseData = buildTransactionBase(payload);

    const existing = await SePayTransaction.findOne({ sepayId });
    if (existing && terminalStates.has(existing.processingState)) {
      await SePayTransaction.updateOne(
        { _id: existing._id },
        {
          $inc: { attemptCount: 1 },
          $set: {
            lastReceivedAt: now,
            payload
          }
        }
      );

      return res.status(200).json({ success: true, duplicate: true });
    }

    if (!existing) {
      try {
        transaction = await SePayTransaction.create({
          sepayId,
          ...baseData,
          result: "received",
          processingState: "received",
          payload,
          lastReceivedAt: now,
          attemptCount: 1
        });
      } catch (error) {
        if (error?.code === 11000) {
          const duplicated = await SePayTransaction.findOne({ sepayId });
          if (!duplicated || terminalStates.has(duplicated.processingState)) {
            return res.status(200).json({ success: true, duplicate: true });
          }

          transaction = duplicated;
          await resetTransactionForAttempt(transaction, baseData, payload, now);
        } else {
          throw error;
        }
      }
    } else {
      transaction = existing;
      await resetTransactionForAttempt(transaction, baseData, payload, now);
    }

    if (baseData.transferType !== "in") {
      await markTransactionResult(transaction, {
        result: "ignored_non_in",
        processingState: "ignored"
      });
      return res.status(200).json({ success: true, ignored: true });
    }

    const invoiceId = parseInvoiceIdFromContent(baseData.content);
    if (!invoiceId) {
      await markTransactionResult(transaction, {
        result: "unmatched_content",
        processingState: "unmatched"
      });
      return res.status(200).json({ success: true, unmatched: true });
    }

    const hoaDon = await HoaDon.findById(invoiceId);
    if (!hoaDon) {
      await markTransactionResult(transaction, {
        result: "invoice_not_found",
        processingState: "unmatched"
      });
      return res.status(200).json({ success: true, unmatched: true });
    }

    const expectedAmount = Number(hoaDon.tongTien || 0);
    const amountDelta = baseData.transferAmount - expectedAmount;

    if (baseData.transferAmount <= 0) {
      await markTransactionResult(transaction, {
        idHoaDon: hoaDon._id,
        expectedAmount,
        amountDelta,
        result: "invalid_amount",
        processingState: "unmatched"
      });
      return res.status(200).json({ success: true, unmatched: true });
    }

    if (baseData.transferAmount < expectedAmount) {
      await markTransactionResult(transaction, {
        idHoaDon: hoaDon._id,
        expectedAmount,
        amountDelta,
        result: "processed_underpaid",
        processingState: "processed"
      });
      return res.status(200).json({ success: true, processed: true, underpaid: true });
    }

    const wasPaidBefore = hoaDon.trangThai === "Da_Thanh_Toan";
    if (!wasPaidBefore) {
      hoaDon.trangThai = "Da_Thanh_Toan";
      await hoaDon.save();
    }

    await markTransactionResult(transaction, {
      idHoaDon: hoaDon._id,
      expectedAmount,
      amountDelta,
      result: wasPaidBefore
        ? "processed_already_paid"
        : amountDelta > 0
          ? "processed_overpaid"
          : "processed_exact",
      processingState: "processed"
    });

    return res.status(200).json({ success: true, processed: true });
  } catch (error) {
    console.error("[SePay] Webhook processing error:", error);

    if (transaction?._id) {
      try {
        await SePayTransaction.updateOne(
          { _id: transaction._id },
          {
            $set: {
              result: "failed",
              processingState: "failed",
              lastError: error?.message || "Unknown error",
              handledAt: new Date()
            }
          }
        );
      } catch (updateError) {
        console.error("[SePay] Failed to persist error state:", updateError);
      }
    }

    return res.status(500).json({ success: false });
  }
};
