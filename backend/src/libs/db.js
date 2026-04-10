import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ tenDangNhap: "admin" });
    if (existingAdmin) {
      console.log("Tài khoản admin đã tồn tại");
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    const admin = new User({
      hoVaTen: "Administrator",
      tenDangNhap: "admin",
      matKhau: hashedPassword,
      vaiTro: "Chu_Tro"
    });

    await admin.save();
    console.log("Tài khoản admin mặc định đã được tạo (admin / admin123)");
  } catch (error) {
    console.error("Lỗi khi tạo tài khoản admin:", error);
  }
};

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGOOSE_URI);
    console.log("Connected to MongoDB");
    await seedAdmin();
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    // In production, we might want to let the process stay alive for a bit to allow logs to be read
    // or just let the cloud provider handle the restart.
    if (process.env.NODE_ENV === "production") {
      console.error("Database connection failed in production. App might not function correctly.");
    } else {
      process.exit(1);
    }
  }
};