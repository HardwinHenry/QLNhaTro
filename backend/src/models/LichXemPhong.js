import mongoose from "mongoose";

const lichXemPhongSchema = new mongoose.Schema({
    thoiGian: { type: Date, required: true },
    trangThai: {
        type: String,
        enum: ["Trong", "Da_Dat"],
        default: "Trong"
    },
    ghiChu: String
}, { timestamps: true });

export default mongoose.model("LichXemPhong", lichXemPhongSchema);
