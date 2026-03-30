import mongoose from "mongoose";

const hopDongSchema = new mongoose.Schema({
  idPhong: { type: mongoose.Schema.Types.ObjectId, ref: "Phong", required: true },
  idKhach: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ngayBatDau: { type: Date, required: true },
  ngayKetThuc: { type: Date, required: true },
  tienCoc: { type: Number, required: true },
  giaThue: { type: Number, required: true },
  giaDien: { type: Number },
  giaNuoc: { type: Number },
  trangThai: {
    type: String,
    enum: ["Con_Hieu_Luc", "Ket_Thuc", "Qua_Han"],
    default: "Con_Hieu_Luc"
  }
}, { timestamps: true });

export default mongoose.model("HopDong", hopDongSchema);