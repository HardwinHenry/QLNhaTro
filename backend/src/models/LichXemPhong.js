import mongoose from "mongoose";

const lichXemPhongSchema = new mongoose.Schema({
    thoiGianBatDau: { type: Date, required: true },
    thoiGianKetThuc: { type: Date, required: true },
    soLuongToiDa: { type: Number, default: 1 },
    soLuongDaDat: { type: Number, default: 0 },
    trangThai: {
        type: String,
        enum: ["Trong", "Da_Dat"],
        default: "Trong"
    },
    ghiChu: String
}, { timestamps: true });

export default mongoose.model("LichXemPhong", lichXemPhongSchema);
