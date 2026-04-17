import mongoose from "mongoose";

const thanhToanSchema = new mongoose.Schema({
  idHoaDon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HoaDon",
    index: true
  },

  ngayThanhToan: Date,
  phuongThuc: String,
  soTien: { type: Number, default: 0 },
  maGiaoDich: { type: String, default: "" },
  maThamChieuNganHang: { type: String, default: "" }
});

export default mongoose.model("ThanhToan", thanhToanSchema);
