import SePayWebhookLog from "../models/SePayWebhookLog.js";
import { normalizeSePayId, processSePayPayload, SEPAY_RESULTS } from "../libs/sepayPayment.js";

let reconcileTimer = null;

function toSePayDateString(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getTransactionsFromResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.transactions)) return data.transactions;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export async function runSePayReconciliation() {
  const sepayToken = String(process.env.SEPAY_TOKEN || "").trim();
  if (!sepayToken) {
    return;
  }

  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    transaction_date_min: toSePayDateString(twoHoursAgo),
    transaction_date_max: toSePayDateString(now)
  });

  const response = await fetch(`https://my.sepay.vn/userapi/transactions/list?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${sepayToken}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SePay reconciliation failed (${response.status}): ${errorText}`);
  }

  const responseData = await response.json();
  const transactions = getTransactionsFromResponse(responseData);

  for (const txPayload of transactions) {
    const sepayId = normalizeSePayId(txPayload?.id);
    if (!sepayId) {
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const existedLog = await SePayWebhookLog.exists({ sepayId });
    if (existedLog) {
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const webhookLog = await SePayWebhookLog.create({
      sepayId,
      payload: txPayload,
      result: SEPAY_RESULTS.FAILED,
      message: "Dữ liệu phát hiện bởi tác vụ đối soát.",
      source: "reconciliation"
    });

    // eslint-disable-next-line no-await-in-loop
    const processed = await processSePayPayload(txPayload, { source: "reconciliation" });

    // eslint-disable-next-line no-await-in-loop
    await SePayWebhookLog.findByIdAndUpdate(webhookLog._id, {
      result: processed.result,
      message: processed.message,
      processedAt: new Date()
    });
  }
}

export function startSePayReconciliationJob() {
  if (reconcileTimer) {
    return;
  }

  const intervalMinutes = Number.parseInt(process.env.SEPAY_RECONCILE_INTERVAL_MINUTES || "60", 10);
  const safeMinutes = Number.isFinite(intervalMinutes) && intervalMinutes > 0 ? intervalMinutes : 60;
  const intervalMs = safeMinutes * 60 * 1000;

  reconcileTimer = setInterval(() => {
    runSePayReconciliation().catch((error) => {
      console.error("[SePay][Reconcile] Job failed:", error?.message || error);
    });
  }, intervalMs);

  if (typeof reconcileTimer.unref === "function") {
    reconcileTimer.unref();
  }

  runSePayReconciliation().catch((error) => {
    console.error("[SePay][Reconcile] Initial run failed:", error?.message || error);
  });
}

