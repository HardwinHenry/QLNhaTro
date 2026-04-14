import LichXemPhong from "../models/LichXemPhong.js";

export const createSlot = async (req, res) => {
    try {
        const { thoiGianBatDau, thoiGianKetThuc, soLuongToiDa, ghiChu } = req.body;

        const start = new Date(thoiGianBatDau);
        const end = new Date(thoiGianKetThuc);
        const now = new Date();

        // 1. Validate starting time is in the future
        if (start < now) {
            return res.status(400).json({ message: "Không thể tạo khung giờ trong quá khứ" });
        }

        // 2. Validate end time is after start time
        if (end <= start) {
            return res.status(400).json({ message: "Thời gian kết thúc phải sau thời gian bắt đầu" });
        }

        // 3. Prevent duplicate slots for the exact same range
        const existing = await LichXemPhong.findOne({ 
            thoiGianBatDau: start,
            thoiGianKetThuc: end 
        });
        if (existing) {
            return res.status(400).json({ message: "Khung giờ này đã tồn tại" });
        }

        const newSlot = new LichXemPhong({
            thoiGianBatDau: start,
            thoiGianKetThuc: end,
            soLuongToiDa: soLuongToiDa || 1,
            ghiChu
        });

        await newSlot.save();
        res.status(201).json(newSlot);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllSlots = async (req, res) => {
    try {
        const query = {};
        // If Khach, only show slots that aren't full and are in the future
        if (req.user?.vaiTro === "Khach") {
            query.trangThai = "Trong";
            query.thoiGianBatDau = { $gte: new Date() };
        }

        const slots = await LichXemPhong.find(query).sort({ thoiGianBatDau: 1 });
        res.json(slots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteSlot = async (req, res) => {
    try {
        const slot = await LichXemPhong.findById(req.params.id);
        if (!slot) {
            return res.status(404).json({ message: "Không tìm thấy khung giờ" });
        }

        // Allow Admin to delete even if booked, but warn in frontend
        // If not booked, just delete. If booked, we allow it to be deleted 
        // which might break references but it's the admin's choice for cleanup.
        await LichXemPhong.findByIdAndDelete(req.params.id);
        res.json({ message: "Đã xóa khung giờ thành công", success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const cleanupOldSlots = async (req, res) => {
    try {
        const now = new Date();
        // Delete all slots in the past that are "Trong" (Available)
        const result = await LichXemPhong.deleteMany({
            thoiGian: { $lt: now },
            trangThai: "Trong"
        });

        res.json({ 
            message: `Đã dọn dẹp ${result.deletedCount} khung giờ cũ`, 
            success: true,
            deletedCount: result.deletedCount 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
