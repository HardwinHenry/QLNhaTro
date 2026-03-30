import CauHinh from "../models/CauHinh.js";

// Khởi tạo cố định theo yêu cầu gốc: MBBank, 0987706342, TRAN TRUONG DANG KHOA
const DEFAULT_CONFIG = {
    nganHang: "MB",
    soTaiKhoan: "0987706342",
    chuTaiKhoan: "TRAN TRUONG DANG KHOA"
};

export const getLatestCauHinh = async (req, res) => {
    try {
        let latest = await CauHinh.findOne().sort({ createdAt: -1 });
        if (!latest) {
            // Nếu chưa có, tự động tạo cấu hình mặc định (từ mã cũ của Chủ Trọ)
            latest = await CauHinh.create(DEFAULT_CONFIG);
        }
        res.json(latest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCauHinh = async (req, res) => {
    try {
        const { nganHang, soTaiKhoan, chuTaiKhoan } = req.body;
        // Xóa sạch lịch sử nếu muốn tiết kiệm DB, vì chỉ cần 1 record duy nhất (tuỳ chọn)
        await CauHinh.deleteMany({});
        
        const newCauHinh = new CauHinh({ nganHang, soTaiKhoan, chuTaiKhoan });
        await newCauHinh.save();
        
        res.status(201).json(newCauHinh);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
