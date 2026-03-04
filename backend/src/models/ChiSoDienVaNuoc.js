import mongoose from "mongoose";

const chiSoDienVaNuocSchema = new mongoose.Schema({
    idPhong: { type: mongoose.Schema.Types.ObjectId, ref: "Phong", required: true },
    thang: { type: String, required: true },
    chiSoDienCu: { type: Number, required: true },
    chiSoDienMoi: { type: Number, required: true },
    chiSoNuocCu: { type: Number, required: true },
    chiSoNuocMoi: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model("ChiSoDienVaNuoc", chiSoDienVaNuocSchema);
