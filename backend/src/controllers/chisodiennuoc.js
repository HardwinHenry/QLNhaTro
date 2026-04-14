import mongoose from "mongoose";
import ChiSoDienVaNuoc from "../models/ChiSoDienVaNuoc.js";

export const getAllChiSos = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === "Khach") {
            const hopDongs = await mongoose.model("HopDong").find({ idKhach: req.user.id });
            const roomIds = hopDongs.map(hd => hd.idPhong);
            filter = { idPhong: { $in: roomIds } };
        }
        const chiSos = await ChiSoDienVaNuoc.find(filter).populate("idPhong");
        res.json(chiSos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLatestChiSoByPhong = async (req, res) => {
    try {
        const { idPhong } = req.params;
        const latest = await ChiSoDienVaNuoc.findOne({ idPhong })
            .sort({ createdAt: -1 });
        res.json(latest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getChiSoLookupByPhong = async (req, res) => {
    try {
        const { idPhong } = req.params;
        const { thang } = req.query; // YYYY-MM format
        
        if (!thang) {
            return res.status(400).json({ message: "Thiếu thông tin tháng." });
        }

        // 1. Tìm bản ghi khớp tháng yêu cầu
        let record = await ChiSoDienVaNuoc.findOne({ idPhong, thang });
        if (record) {
            return res.json(record);
        }

        // 2. Nếu không có, tìm bản ghi cuối cùng trước tháng này
        let latestBefore = await ChiSoDienVaNuoc.findOne({ 
            idPhong, 
            thang: { $lt: thang } 
        }).sort({ thang: -1 });
        
        res.json(latestBefore);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createChiSo = async (req, res) => {
    try {
        const { idPhong, thang, chiSoDienCu, chiSoDienMoi, chiSoNuocCu, chiSoNuocMoi } = req.body;

        const existing = await ChiSoDienVaNuoc.findOne({ idPhong, thang });
        if (existing) {
            return res.status(400).json({ message: `Đã có chỉ số cho phòng này trong tháng ${thang}.` });
        }

        if (chiSoDienMoi < chiSoDienCu) {
            return res.status(400).json({ message: "Chỉ số điện mới không được nhỏ hơn chỉ số cũ." });
        }
        if (chiSoNuocMoi < chiSoNuocCu) {
            return res.status(400).json({ message: "Chỉ số nước mới không được nhỏ hơn chỉ số cũ." });
        }

        const newChiSo = new ChiSoDienVaNuoc(req.body);
        await newChiSo.save();
        res.status(201).json(newChiSo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteAllChiSos = async (req, res) => {
    try {
        const result = await ChiSoDienVaNuoc.deleteMany({});
        res.json({ message: `Đã xóa thành công ${result.deletedCount} lịch sử điện nước.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const deleteChiSo = async (req, res) => {
    try {
        const { id } = req.params;
        await ChiSoDienVaNuoc.findByIdAndDelete(id);
        res.json({ message: "Xóa chỉ số thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getChiSoGanNhat = async (req, res) => {
    try {
        const { idPhong } = req.params;

        // Tìm bản ghi mới nhất dựa trên tháng (thang: -1)
        const chiSo = await ChiSoDienVaNuoc.findOne({ idPhong })
            .sort({ thang: -1 });

        if (!chiSo) {
            return res.json(null);
        }

        res.json(chiSo);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
};
