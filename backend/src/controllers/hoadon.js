import mongoose from "mongoose";
import HoaDon from "../models/HoaDon.js";
import HopDong from "../models/HopDong.js";
import User from "../models/User.js";
import Phong from "../models/Phong.js";
import DayPhong from "../models/DayPhong.js";

export const getAllHoaDons = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === "Khach") {
            const hopDongs = await HopDong.find({ idKhach: req.user.id });
            const hopDongIds = hopDongs.map(hd => hd._id);
            filter = { idHopDong: { $in: hopDongIds } };
        }

        const hoaDons = await HoaDon.find(filter).populate({
            path: "idHopDong",
            populate: [
                { path: "idKhach" },
                { 
                    path: "idPhong",
                    populate: { path: "idDayPhong" }
                }
            ]
        });
        res.json(hoaDons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const createHoaDon = async (req, res) => {
    try {
        const { idHopDong, ngayThangNam } = req.body;

        // Validation: Duplicate check (by month and year)
        const date = new Date(ngayThangNam);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        const existing = await HoaDon.findOne({
            idHopDong,
            ngayThangNam: { $gte: startOfMonth, $lte: endOfMonth }
        });

        if (existing) {
            return res.status(400).json({ message: "Đã có hóa đơn cho hợp đồng này trong tháng đã chọn." });
        }

        // Validation: No past months
        const today = new Date();
        const firstDayOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const inputDate = new Date(ngayThangNam);
        const firstDayOfInputMonth = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1);

        if (firstDayOfInputMonth < firstDayOfThisMonth) {
            return res.status(400).json({ message: "Không thể tạo hóa đơn cho các tháng trước tháng hiện tại." });
        }

        // Validation: Must be within contract term
        const hopDong = await HopDong.findById(idHopDong);
        if (hopDong) {
            const startDate = new Date(hopDong.ngayBatDau);
            const endDate = hopDong.ngayKetThuc ? new Date(hopDong.ngayKetThuc) : null;

            if (inputDate < startDate || (endDate && inputDate > endDate)) {
                return res.status(400).json({ message: `Ngày lập phải nằm trong thời hạn hợp đồng (${new Date(startDate).toLocaleDateString("vi-VN")}${endDate ? ` - ${new Date(endDate).toLocaleDateString("vi-VN")}` : ""})` });
            }
        }

        const newHoaDon = new HoaDon(req.body);
        await newHoaDon.save();
        res.status(201).json(newHoaDon);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateHoaDon = async (req, res) => {
    try {
        const { ngayThangNam } = req.body;
        if (ngayThangNam) {
            const today = new Date();
            const firstDayOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const inputDate = new Date(ngayThangNam);
            const firstDayOfInputMonth = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1);

            if (firstDayOfInputMonth < firstDayOfThisMonth) {
                return res.status(400).json({ message: "Không thể chỉnh sửa hóa đơn cho các tháng trước tháng hiện tại." });
            }
        }

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
