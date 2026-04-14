import YeuCauDatPhong from "../models/YeuCauDatPhong.js";
import Phong from "../models/Phong.js";
import LichXemPhong from "../models/LichXemPhong.js";

export const createYeuCau = async (req, res) => {
    try {
        const { idPhong, ngayDat, ghiChu, idSlot } = req.body;
        const idKhach = req.user.id;

        // Check if room exists
        const phong = await Phong.findById(idPhong);
        if (!phong) {
            return res.status(404).json({ message: "Không tìm thấy phòng" });
        }

        // If slot is provided, validate and handle occupancy
        if (idSlot) {
            const slot = await LichXemPhong.findById(idSlot);
            if (!slot) return res.status(404).json({ message: "Không tìm thấy khung giờ" });
            
            if (slot.soLuongDaDat >= slot.soLuongToiDa) {
                return res.status(400).json({ message: "Khung giờ này đã hết chỗ" });
            }

            slot.soLuongDaDat += 1;
            if (slot.soLuongDaDat >= slot.soLuongToiDa) {
                slot.trangThai = "Da_Dat";
            }
            await slot.save();
        }

        const newYeuCau = new YeuCauDatPhong({
            idKhach,
            idPhong,
            idSlot,
            ngayDat,
            ghiChu
        });

        await newYeuCau.save();
        res.status(201).json(newYeuCau);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllYeuCaus = async (req, res) => {
    try {
        const query = {};
        if (req.user.vaiTro === "Khach") {
            query.idKhach = req.user.id;
        }

        const yeuCaus = await YeuCauDatPhong.find(query)
            .populate("idKhach", "hoVaTen sdt")
            .populate("idPhong", "tenPhong giaPhong")
            .sort({ createdAt: -1 });

        res.json(yeuCaus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const confirmYeuCau = async (req, res) => {
    try {
        const yeuCau = await YeuCauDatPhong.findById(req.params.id);
        if (!yeuCau) {
            return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
        }

        yeuCau.trangThai = "Da_Xac_Nhan";
        await yeuCau.save();

        res.json({ message: "Đã xác nhận yêu cầu xem phòng", success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const cancelYeuCau = async (req, res) => {
    try {
        const yeuCau = await YeuCauDatPhong.findById(req.params.id);
        if (!yeuCau) {
            return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
        }

        // Customer can only cancel their own
        if (req.user.vaiTro === "Khach" && yeuCau.idKhach.toString() !== req.user.id) {
            return res.status(403).json({ message: "Bạn không có quyền hủy yêu cầu này" });
        }

        yeuCau.trangThai = "Da_Huy";
        await yeuCau.save();

        // Release slot capacity if applicable
        if (yeuCau.idSlot) {
            const slot = await LichXemPhong.findById(yeuCau.idSlot);
            if (slot) {
                slot.soLuongDaDat = Math.max(0, slot.soLuongDaDat - 1);
                slot.trangThai = "Trong"; // Set back to available
                await slot.save();
            }
        }

        res.json({ message: "Đã hủy yêu cầu", success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateYeuCau = async (req, res) => {
    try {
        const { ngayDat, ghiChu } = req.body;
        const yeuCau = await YeuCauDatPhong.findById(req.params.id);

        if (!yeuCau) {
            return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
        }

        // Ownership check for Guest
        if (req.user.vaiTro === "Khach" && yeuCau.idKhach.toString() !== req.user.id) {
            return res.status(403).json({ message: "Bạn không có quyền cập nhật yêu cầu này" });
        }

        if (ngayDat) yeuCau.ngayDat = ngayDat;
        if (ghiChu !== undefined) yeuCau.ghiChu = ghiChu;

        await yeuCau.save();
        res.json({ message: "Cập nhật thành công", data: yeuCau });
    } catch (error) {
        console.error("Lỗi updateYeuCau:", error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteYeuCau = async (req, res) => {
    try {
        const yeuCau = await YeuCauDatPhong.findByIdAndDelete(req.params.id);
        if (!yeuCau) {
            return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
        }
        if (yeuCau.idSlot) {
            const slot = await LichXemPhong.findById(yeuCau.idSlot);
            if (slot) {
                slot.soLuongDaDat = Math.max(0, slot.soLuongDaDat - 1);
                slot.trangThai = "Trong";
                await slot.save();
            }
        }
        res.json({ message: "Đã xóa yêu cầu xem phòng", success: true });
    } catch (error) {
        console.error("Lỗi deleteYeuCau:", error);
        res.status(500).json({ message: error.message });
    }
};
