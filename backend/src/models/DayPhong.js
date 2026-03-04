import mongoose from "mongoose";

const dayPhongSchema = new mongoose.Schema({
    soDay: { type: String, required: true },
    tang: { type: Number, required: true, default: 1 },
    viTri: { type: String, required: true },
    hinhAnh: { type: String }
}, { timestamps: true });

export default mongoose.model("DayPhong", dayPhongSchema);
