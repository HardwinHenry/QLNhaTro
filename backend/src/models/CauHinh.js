import mongoose from "mongoose";

const cauHinhSchema = new mongoose.Schema({
    nganHang: { type: String, required: true },
    soTaiKhoan: { type: String, required: true },
    chuTaiKhoan: { type: String, required: true },
    diaChi: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("CauHinh", cauHinhSchema);
