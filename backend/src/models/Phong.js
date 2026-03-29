import mongoose from "mongoose";

const phongSchema = new mongoose.Schema({
  idPhong: { type: String, required: true, unique: true },
  tenPhong: { type: String, required: true },
  idDayPhong: { type: mongoose.Schema.Types.ObjectId, ref: "DayPhong", required: true },
  giaPhong: { type: Number, required: true },
  dienTich: { type: Number, required: true },
  loaiPhong: {
    type: String,
    enum: ["Co_Gac", "Khong_Gac"],
    required: true
  },
  trangThai: {
    type: String,
    enum: ["Trong", "Da_Thue"],
    default: "Trong"
  },
  hinhAnh: { type: String },
  moTa: { type: String },
  vatTu: [{ type: mongoose.Schema.Types.ObjectId, ref: "VatTu" }]
}, { timestamps: true });

export default mongoose.model("Phong", phongSchema);