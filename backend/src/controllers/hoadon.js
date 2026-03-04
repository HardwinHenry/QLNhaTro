import mongoose from "mongoose";
import HoaDon from "../models/HoaDon.js";

export const getAllHoaDons = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === "Khach") {
            const hopDongs = await mongoose.model("HopDong").find({ idKhach: req.user.id });
            const hopDongIds = hopDongs.map(hd => hd._id);
            filter = { idHopDong: { $in: hopDongIds } };
        }

        const hoaDons = await HoaDon.find(filter).populate({
            path: "idHopDong",
            populate: { path: "idKhach idPhong" }
        });
        res.json(hoaDons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const createHoaDon = async (req, res) => {
    try {
        const newHoaDon = new HoaDon(req.body);
        await newHoaDon.save();
        res.status(201).json(newHoaDon);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateHoaDon = async (req, res) => {
    try {
        const updatedHoaDon = await HoaDon.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedHoaDon);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteHoaDon = async (req, res) => {
    try {
        await HoaDon.findByIdAndDelete(req.params.id);
        res.json({ message: "Xóa hóa đơn thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const requestPayment = async (req, res) => {
    try {
        const hoaDon = await HoaDon.findById(req.params.id).populate({
            path: "idHopDong",
            populate: { path: "idKhach" }
        });

        if (!hoaDon) {
            return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
        }

        // Logic "Yêu cầu thanh toán" có thể gửi tin nhắn/email ở đây.
        // Hiện tại chúng ta chỉ giả lập bằng cách phản hồi thành công.

        res.json({
            message: `Đã gửi yêu cầu thanh toán cho khách ${hoaDon.idHopDong.idKhach.hoVaTen}`,
            success: true
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
