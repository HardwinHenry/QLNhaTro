import mongoose from "mongoose";

const sePayWebhookLogSchema = new mongoose.Schema(
  {
    sepayId: {
      type: String,
      default: "",
      index: true
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    result: {
      type: String,
      enum: [
        "success",
        "duplicate",
        "unmatched_code",
        "amount_mismatch",
        "wrong_direction",
        "already_paid",
        "failed"
      ],
      default: "failed"
    },
    message: {
      type: String,
      default: ""
    },
    source: {
      type: String,
      enum: ["webhook", "reconciliation"],
      default: "webhook"
    },
    processedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

sePayWebhookLogSchema.index({ sepayId: 1, processedAt: -1 });

export default mongoose.model("SePayWebhookLog", sePayWebhookLogSchema);
