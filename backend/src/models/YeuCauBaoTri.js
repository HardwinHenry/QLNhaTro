import mongoose from "mongoose";

const yeuCauBaoTriSchema = new mongoose.Schema({
  idPhong: { type: mongoose.Schema.Types.ObjectId, ref: "Phong", required: true },
  idKhach: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  idVatTu: { type: mongoose.Schema.Types.ObjectId, ref: "VatTu" }, // Optional equipment selection
  moTa: { type: String, required: true },
  hinhAnh: { type: String }, // Path to issue image
  trangThai: {
    type: String,
    enum: ["Dang_Cho", "Dang_Xu_Ly", "Da_Hoan_Thanh"],
    default: "Dang_Cho"
  },
  ngayYeuCau: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("YeuCauBaoTri", yeuCauBaoTriSchema);
