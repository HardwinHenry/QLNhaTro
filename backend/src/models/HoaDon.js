import mongoose from "mongoose";

const hoaDonSchema = new mongoose.Schema({
  idHopDong: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HopDong",
    required: true
  },

  ngayThangNam: { type: Date, required: true },

  tienPhong: { type: Number, required: true },

  // Electricity
  chiSoDienCu: { type: Number, default: 0 },
  chiSoDienMoi: { type: Number, required: true },
  giaDien: { type: Number, default: 0 },
  tienDien: { type: Number, default: 0 },

  // Water
  chiSoNuocCu: { type: Number, default: 0 },
  chiSoNuocMoi: { type: Number, required: true },
  giaNuoc: { type: Number, default: 0 },
  tienNuoc: { type: Number, default: 0 },

  tienDichVu: { type: Number, default: 0 },
  tongTien: { type: Number, required: true },

  trangThai: {
    type: String,
    enum: ["Chua_Thanh_Toan", "Da_Thanh_Toan"],
    default: "Chua_Thanh_Toan"
  }
}, { timestamps: true });

export default mongoose.model("HoaDon", hoaDonSchema);