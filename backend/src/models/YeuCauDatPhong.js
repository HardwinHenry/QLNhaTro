import mongoose from "mongoose";

const yeuCauDatPhongSchema = new mongoose.Schema({
    idKhach: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    idPhong: { type: mongoose.Schema.Types.ObjectId, ref: "Phong", required: true },
    idSlot: { type: mongoose.Schema.Types.ObjectId, ref: "LichXemPhong" },
    ngayDat: { type: Date, required: true },
    trangThai: {
        type: String,
        enum: ["Cho_Xac_Nhan", "Da_Xac_Nhan", "Da_Huy"],
        default: "Cho_Xac_Nhan"
    },
    ghiChu: String
}, { timestamps: true });

export default mongoose.model("YeuCauDatPhong", yeuCauDatPhongSchema);
