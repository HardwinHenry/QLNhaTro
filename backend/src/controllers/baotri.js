import YeuCauBaoTri from "../models/YeuCauBaoTri.js";
import fs from "fs";
import path from "path";

export const createYeuCauBaoTri = async (req, res) => {
    try {
        const { idPhong, moTa, idVatTu } = req.body;
        const idKhach = req.user.id;

        const hinhAnh = req.file ? `/uploads/${req.file.filename}` : null;

        const newItem = new YeuCauBaoTri({
            idPhong,
            idKhach,
            idVatTu: idVatTu || null,
            moTa,
            hinhAnh
        });

        await newItem.save();
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllYeuCauBaoTri = async (req, res) => {
    try {
        const result = await YeuCauBaoTri.find()
            .populate("idPhong", "tenPhong")
            .populate("idKhach", "tenDangNhap hoTen soDienThoai")
            .populate("idVatTu", "tenVatTu")
            .sort({ createdAt: -1 });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getYeuCauBaoTriByKhach = async (req, res) => {
    try {
        const result = await YeuCauBaoTri.find({ idKhach: req.user.id })
            .populate("idPhong", "tenPhong")
            .populate("idVatTu", "tenVatTu")
            .sort({ createdAt: -1 });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateTrangThaiBaoTri = async (req, res) => {
    const { id } = req.params;
    const { trangThai } = req.body;
    try {
        const updated = await YeuCauBaoTri.findByIdAndUpdate(
            id,
            { trangThai },
            { new: true }
        ).populate("idPhong", "tenPhong").populate("idKhach", "tenDangNhap hoTen");

        if (!updated) return res.status(404).json({ message: "Không tìm thấy yêu cầu" });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteYeuCauBaoTri = async (req, res) => {
    const { id } = req.params;
    try {
        const item = await YeuCauBaoTri.findById(id);
        if (!item) return res.status(404).json({ message: "Không tìm thấy yêu cầu" });

        // Phân quyền xóa
        const isOwner = item.idKhach.toString() === req.user.id;
        const isAdmin = req.user.vaiTro === "Chu_Tro";

        if (!isAdmin) {
            if (!isOwner) {
                return res.status(403).json({ message: "Bạn không có quyền xóa yêu cầu này" });
            }
            if (item.trangThai !== "Dang_Cho") {
                return res.status(400).json({ message: "Không thể xóa yêu cầu đã được xử lý" });
            }
        }

        // Delete image file if exists
        if (item.hinhAnh) {
            const imagePath = path.join(process.cwd(), "public", item.hinhAnh);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await YeuCauBaoTri.findByIdAndDelete(id);
        res.json({ message: "Xóa yêu cầu thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
