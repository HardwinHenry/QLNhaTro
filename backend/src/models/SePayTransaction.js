import mongoose from "mongoose";

const sePayTransactionSchema = new mongoose.Schema(
  {
    sepayId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    transferType: {
      type: String,
      default: ""
    },
    transferAmount: {
      type: Number,
      default: 0
    },
    content: {
      type: String,
      default: ""
    },
    accountNumber: {
      type: String,
      default: ""
    },
    gateway: {
      type: String,
      default: ""
    },
    referenceCode: {
      type: String,
      default: ""
    },
    transactionDate: {
      type: Date
    },
    idHoaDon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HoaDon",
      default: null
    },
    expectedAmount: {
      type: Number,
      default: 0
    },
    amountDelta: {
      type: Number,
      default: 0
    },
    result: {
      type: String,
      enum: [
        "received",
        "processed_exact",
        "processed_overpaid",
        "processed_underpaid",
        "processed_already_paid",
        "ignored_non_in",
        "unmatched_content",
        "invoice_not_found",
        "invalid_amount",
        "failed"
      ],
      default: "received"
    },
    processingState: {
      type: String,
      enum: ["received", "processed", "ignored", "unmatched", "failed"],
      default: "received",
      index: true
    },
    attemptCount: {
      type: Number,
      default: 1
    },
    lastError: {
      type: String,
      default: ""
    },
    handledAt: {
      type: Date
    },
    lastReceivedAt: {
      type: Date,
      default: Date.now
    },
    payload: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

export default mongoose.model("SePayTransaction", sePayTransactionSchema);
