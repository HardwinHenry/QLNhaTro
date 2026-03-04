import mongoose from "mongoose";

const thanhToanSchema = new mongoose.Schema({
  idHoaDon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HoaDon"
  },

  ngayThanhToan: Date,
  phuongThuc: String
});

export default mongoose.model("ThanhToan", thanhToanSchema);