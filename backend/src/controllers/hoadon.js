import crypto from "node:crypto";
import mongoose from "mongoose";
import HoaDon from "../models/HoaDon.js";
import HopDong from "../models/HopDong.js";
import User from "../models/User.js";
import Phong from "../models/Phong.js";
import DayPhong from "../models/DayPhong.js";
import GiaDienVaNuoc from "../models/GiaDienVaNuoc.js";
import ChiSoDienVaNuoc from "../models/ChiSoDienVaNuoc.js";

function normalizeCodePart(rawValue) {
    return String(rawValue || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
}

async function generateUniquePaymentCode(roomRef, invoiceDate) {
    const prefix = normalizeCodePart(process.env.SEPAY_PAYMENT_PREFIX || "TRO").slice(0, 4) || "TRO";
    const roomToken = normalizeCodePart(roomRef).slice(0, 4) || "ROOM";
    const monthToken = `${invoiceDate.getFullYear()}${String(invoiceDate.getMonth() + 1).padStart(2, "0")}`;

    for (let attempt = 0; attempt < 10; attempt += 1) {
        const randomToken = crypto.randomBytes(2).toString("hex").toUpperCase().slice(0, 3);
        const paymentCode = `${prefix}${roomToken}${monthToken}${randomToken}`.slice(0, 20);

        // eslint-disable-next-line no-await-in-loop
        const existed = await HoaDon.exists({ maThanhToan: paymentCode });
        if (!existed) {
            return paymentCode;
        }
    }

    throw new Error("Không thể tạo mã thanh toán duy nhất cho hóa đơn.");
}

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

// Helper function to sync utility readings history
async function syncChiSoFromHoaDon(hoaDon) {
    try {
        const hopDong = await HopDong.findById(hoaDon.idHopDong);
        if (!hopDong) return;

        const idPhong = hopDong.idPhong;
        const inputDate = new Date(hoaDon.ngayThangNam);
        const thang = `${inputDate.getFullYear()}-${String(inputDate.getMonth() + 1).padStart(2, '0')}`;

        await ChiSoDienVaNuoc.findOneAndUpdate(
            { idPhong, thang },
            {
                chiSoDienCu: hoaDon.chiSoDienCu,
                chiSoDienMoi: hoaDon.chiSoDienMoi,
                chiSoNuocCu: hoaDon.chiSoNuocCu,
                chiSoNuocMoi: hoaDon.chiSoNuocMoi
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error("Lỗi khi đồng bộ chỉ số điện nước từ hóa đơn:", error);
    }
}

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

        // Validation: Sequential check (No backfilling)
        const laterInvoice = await HoaDon.findOne({
            idHopDong,
            ngayThangNam: { $gt: endOfMonth }
        });

        if (laterInvoice) {
            return res.status(400).json({ message: "Không thể tạo hóa đơn cho tháng cũ khi đã có hóa đơn mới hơn cho hợp đồng này." });
        }

        // Validation: Only allow current month
        const today = new Date();
        const firstDayOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const inputDate = new Date(ngayThangNam);
        const firstDayOfInputMonth = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1);

        if (firstDayOfInputMonth.getTime() !== firstDayOfThisMonth.getTime()) {
            return res.status(400).json({ message: "Chỉ có thể tạo hóa đơn cho tháng hiện tại." });
        }


        // Validation: Must be within contract term
        const hopDong = await HopDong.findById(idHopDong);
        if (!hopDong) {
            return res.status(404).json({ message: "Không tìm thấy hợp đồng" });
        }
        
        const startDate = new Date(hopDong.ngayBatDau);
        const endDate = hopDong.ngayKetThuc ? new Date(hopDong.ngayKetThuc) : null;

        if (inputDate < startDate || (endDate && inputDate > endDate)) {
            return res.status(400).json({ message: `Ngày lập phải nằm trong thời hạn hợp đồng (${new Date(startDate).toLocaleDateString("vi-VN")}${endDate ? ` - ${new Date(endDate).toLocaleDateString("vi-VN")}` : ""})` });
        }

        // Logic tính toán tập trung
        let { 
            tienPhong, 
            chiSoDienCu, chiSoDienMoi, giaDien, 
            chiSoNuocCu, chiSoNuocMoi, giaNuoc,
            tienDichVu = 0 
        } = req.body;

        // Tự động lấy đơn giá mới nhất tại thời điểm lập hóa đơn nếu thiếu
        if (!giaDien || !giaNuoc) {
            const referenceDate = ngayThangNam ? new Date(ngayThangNam) : new Date();
            const latestGia = await GiaDienVaNuoc.findOne({
                ngayApDung: { $lte: referenceDate }
            }).sort({ ngayApDung: -1 });

            if (latestGia) {
                if (!giaDien) giaDien = latestGia.giaDien;
                if (!giaNuoc) giaNuoc = latestGia.giaNuoc;
            }
        }


        // Tự động lấy tiền phòng từ hợp đồng nếu thiếu
        if (!tienPhong) {
            tienPhong = hopDong.giaThue;
        }

        const tienDien = (chiSoDienMoi - chiSoDienCu) * giaDien;
        const tienNuoc = (chiSoNuocMoi - chiSoNuocCu) * giaNuoc;
        const tongTien = (tienPhong || 0) + (tienDien || 0) + (tienNuoc || 0) + (tienDichVu || 0);
        const thangThanhToan = `${inputDate.getFullYear()}-${String(inputDate.getMonth() + 1).padStart(2, "0")}`;
        const dueDayRaw = Number.parseInt(process.env.INVOICE_DUE_DAY || "5", 10);
        const dueDay = Number.isFinite(dueDayRaw) ? Math.min(28, Math.max(1, dueDayRaw)) : 5;
        // Due date is set to next month so newly created invoices are not immediately overdue.
        const hanThanhToan = new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, dueDay, 23, 59, 59, 999);
        const maThanhToan = await generateUniquePaymentCode(hopDong.idPhong, inputDate);
        const trangThaiBanDau = hanThanhToan.getTime() < Date.now() ? "Qua_Han" : "Chua_Thanh_Toan";

        const newHoaDon = new HoaDon({
            idHopDong,
            idKhach: hopDong.idKhach,
            idPhong: hopDong.idPhong,
            ngayThangNam,
            thangThanhToan,
            hanThanhToan,
            maThanhToan,
            tienPhong,
            chiSoDienCu,
            chiSoDienMoi,
            giaDien,
            tienDien,
            chiSoNuocCu,
            chiSoNuocMoi,
            giaNuoc,
            tienNuoc,
            tienDichVu,
            tongTien,
            trangThai: trangThaiBanDau
        });
        await newHoaDon.save();
        
        // Tự động đồng bộ sang lịch sử điện nước
        await syncChiSoFromHoaDon(newHoaDon);
        
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

            if (firstDayOfInputMonth.getTime() !== firstDayOfThisMonth.getTime()) {
                return res.status(400).json({ message: "Chỉ có thể điều chỉnh hóa đơn trong tháng hiện tại." });
            }
        }

        const h = await HoaDon.findById(req.params.id).populate("idHopDong");
        if (!h) {
            return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
        }

        let {
            tienPhong,
            chiSoDienCu, chiSoDienMoi, giaDien,
            chiSoNuocCu, chiSoNuocMoi, giaNuoc,
            tienDichVu,
            tongTien
        } = req.body;

        // Recalculate based on current or updated values
        const finalTienPhong = tienPhong !== undefined ? tienPhong : h.tienPhong;
        const finalDienCu = chiSoDienCu !== undefined ? chiSoDienCu : h.chiSoDienCu;
        const finalDienMoi = chiSoDienMoi !== undefined ? chiSoDienMoi : h.chiSoDienMoi;
        const finalGiaDien = giaDien !== undefined ? giaDien : h.giaDien;
        const finalNuocCu = chiSoNuocCu !== undefined ? chiSoNuocCu : h.chiSoNuocCu;
        const finalNuocMoi = chiSoNuocMoi !== undefined ? chiSoNuocMoi : h.chiSoNuocMoi;
        const finalGiaNuoc = giaNuoc !== undefined ? giaNuoc : h.giaNuoc;
        const finalTienDichVu = tienDichVu !== undefined ? tienDichVu : h.tienDichVu;

        const tienDien = (finalDienMoi - finalDienCu) * finalGiaDien;
        const tienNuoc = (finalNuocMoi - finalNuocCu) * finalGiaNuoc;
        const calculatedTotal = (finalTienPhong || 0) + (tienDien || 0) + (tienNuoc || 0) + (finalTienDichVu || 0);

        const { trangThai: _ignoredTrangThai, idHopDong: _ignoredHopDong, ...safeUpdateBody } = req.body;

        const updateData = {
            ...safeUpdateBody,
            tienDien,
            tienNuoc,
            tongTien: tongTien ?? calculatedTotal
        };

        const updatedHoaDon = await HoaDon.findByIdAndUpdate(req.params.id, updateData, { new: true });
        
        // Tự động đồng bộ sang lịch sử điện nước
        if (updatedHoaDon) {
            await syncChiSoFromHoaDon(updatedHoaDon);
        }
        
        res.json(updatedHoaDon);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteHoaDon = async (req, res) => {
    try {
        const hoaDon = await HoaDon.findById(req.params.id).populate("idHopDong");
        if (hoaDon && hoaDon.idHopDong) {
            const idPhong = hoaDon.idHopDong.idPhong;
            const inputDate = new Date(hoaDon.ngayThangNam);
            const thang = `${inputDate.getFullYear()}-${String(inputDate.getMonth() + 1).padStart(2, '0')}`;
            
            // Delete the synced utility history entry for this month
            await ChiSoDienVaNuoc.findOneAndDelete({ idPhong, thang });
        }

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
