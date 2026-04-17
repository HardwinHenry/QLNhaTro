import crypto from "node:crypto";
import SePayWebhookLog from "../models/SePayWebhookLog.js";
import { normalizeSePayId, processSePayPayload, SEPAY_RESULTS } from "../libs/sepayPayment.js";

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

function secureCompare(received, expected) {
  const receivedBuffer = Buffer.from(received || "", "utf8");
  const expectedBuffer = Buffer.from(expected || "", "utf8");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

function getApiKeyFromAuthorizationHeader(rawHeader) {
  if (typeof rawHeader !== "string") return "";

  const matched = rawHeader.trim().match(/^apikey\s+(.+)$/i);
  if (!matched?.[1]) return "";
  return matched[1].trim();
}

async function updateWebhookLog(logId, updates) {
  if (!logId) return;

  try {
    await SePayWebhookLog.findByIdAndUpdate(logId, {
      ...updates,
      processedAt: new Date()
    });
  } catch (error) {
    console.error("[SePay] Failed to update webhook log:", error?.message || error);
  }
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
  const payload = req.body && typeof req.body === "object" ? req.body : {};
  const sepayId = normalizeSePayId(payload?.id);

  let webhookLogId = null;

  try {
    const webhookLog = await SePayWebhookLog.create({
      sepayId,
      payload,
      result: SEPAY_RESULTS.FAILED,
      message: "Đã nhận webhook, đang xác thực.",
      source: "webhook"
    });
    webhookLogId = webhookLog._id;
  } catch (error) {
    console.error("[SePay] Failed to write initial webhook log:", error?.message || error);
  }

  try {
    const configuredApiKey = String(process.env.SEPAY_API_KEY || "").trim();
    if (!configuredApiKey) {
      await updateWebhookLog(webhookLogId, {
        result: SEPAY_RESULTS.FAILED,
        message: "Thiếu SEPAY_API_KEY trong môi trường."
      });
      return res.status(500).json({ success: false, error: "Webhook not configured" });
    }

    const receivedApiKey = getApiKeyFromAuthorizationHeader(req.headers.authorization);
    if (!secureCompare(receivedApiKey, configuredApiKey)) {
      await updateWebhookLog(webhookLogId, {
        result: SEPAY_RESULTS.FAILED,
        message: "Authorization không hợp lệ."
      });
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const processed = await processSePayPayload(payload, { source: "webhook" });

    await updateWebhookLog(webhookLogId, {
      sepayId: processed.sepayId || sepayId,
      result: processed.result,
      message: processed.message
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    await updateWebhookLog(webhookLogId, {
      result: SEPAY_RESULTS.FAILED,
      message: error?.message || "Lỗi hệ thống khi xử lý webhook."
    });

    return res.status(200).json({ success: true });
  }
};

