import mongoose from "mongoose";

const giaDienVaNuocSchema = new mongoose.Schema({
    ngayApDung: { type: Date, required: true },
    giaDien: { type: Number, required: true },
    giaNuoc: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model("GiaDienVaNuoc", giaDienVaNuocSchema);
