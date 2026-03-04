import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const seedManager = async () => {
    try {
        await mongoose.connect(process.env.MONGOOSE_URI);
        console.log("✅ Connected to MongoDB");

        const username = "quanly";
        const password = "Quanly1@";
        const role = "quan_ly";

        // Check if user already exists
        const existingUser = await User.findOne({ tenDangNhap: username });
        if (existingUser) {
            console.log(`⏩ Tài khoản ${username} đã tồn tại, cập nhật mật khẩu và vai trò...`);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            existingUser.matKhau = hashedPassword;
            existingUser.vaiTro = role;
            await existingUser.save();
            console.log("✅ Cập nhật thành công!");
        } else {
            console.log(`🆕 Đang tạo tài khoản ${username}...`);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = new User({
                hoVaTen: "Người Quản Lý",
                tenDangNhap: username,
                matKhau: hashedPassword,
                sdt: "0123456789",
                cccd: "123456789012",
                vaiTro: role
            });

            await newUser.save();
            console.log("✅ Tạo tài khoản thành công!");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi khi seed tài khoản:", error);
        process.exit(1);
    }
};

seedManager();
