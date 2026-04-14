import LichXemPhong from "../models/LichXemPhong.js";

export const createSlot = async (req, res) => {
    try {
        const { thoiGian, ghiChu } = req.body;

        // Prevent duplicate slots for the same time
        const existing = await LichXemPhong.findOne({ thoiGian: new Date(thoiGian) });
        if (existing) {
            return res.status(400).json({ message: "Khung giờ này đã tồn tại" });
        }

        const newSlot = new LichXemPhong({
            thoiGian,
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
        // If Khach, only show available slots
        if (req.user?.vaiTro === "Khach") {
            query.trangThai = "Trong";
            // Also only show future slots
            query.thoiGian = { $gte: new Date() };
        }

        const slots = await LichXemPhong.find(query).sort({ thoiGian: 1 });
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

        if (slot.trangThai === "Da_Dat") {
            return res.status(400).json({ message: "Không thể xóa khung giờ đã có khách đặt" });
        }

        await LichXemPhong.findByIdAndDelete(req.params.id);
        res.json({ message: "Đã xóa khung giờ thành công", success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
