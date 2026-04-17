import mongoose from "mongoose";

const hoaDonSchema = new mongoose.Schema({
  idHopDong: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HopDong",
    required: true
  },
  idKhach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  idPhong: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Phong"
  },

  ngayThangNam: { type: Date, required: true },
  thangThanhToan: { type: String },
  hanThanhToan: { type: Date },
  maThanhToan: { type: String },

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
  soTienDaThanhToan: { type: Number, default: 0 },
  ngayThanhToan: { type: Date },
  sepayTransactionId: { type: String },
  maThamChieuNganHang: { type: String },

  trangThai: {
    type: String,
    enum: ["Chua_Thanh_Toan", "Da_Thanh_Toan", "Qua_Han"],
    default: "Chua_Thanh_Toan"
  }
}, { timestamps: true });

hoaDonSchema.index({ maThanhToan: 1 }, { unique: true, sparse: true });
hoaDonSchema.index({ thangThanhToan: 1, idPhong: 1 });
hoaDonSchema.index({ thangThanhToan: 1, idKhach: 1 });

export default mongoose.model("HoaDon", hoaDonSchema);
