import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  hoVaTen: String,
  tenDangNhap: { type: String, required: true, unique: true },
  matKhau: { type: String, required: true },
  sdt: String,
  cccd: String,
  avatar: String,
  vaiTro: {
    type: String,
    enum: ["Chu_Tro", "Khach"],
    default: "Khach"
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
