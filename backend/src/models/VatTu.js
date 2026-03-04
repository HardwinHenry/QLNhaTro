import mongoose from "mongoose";

const vatTuSchema = new mongoose.Schema({
    tenVatTu: { type: String, required: true },
    donGia: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model("VatTu", vatTuSchema);
