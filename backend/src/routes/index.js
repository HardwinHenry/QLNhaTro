import express from "express";
import { login, register, getMe, refreshAccessToken, getAllUsers, updateMe, changePassword } from "../controllers/auth.js";
import { getAllPhongs, getPhongById, createPhong, updatePhong, deletePhong } from "../controllers/phong.js";
import { getAllHopDongs, createHopDong, updateHopDong, deleteHopDong, extendHopDong } from "../controllers/hopdong.js";
import { getAllHoaDons, createHoaDon, updateHoaDon, deleteHoaDon, requestPayment } from "../controllers/hoadon.js";
import { getAllDayPhongs, createDayPhong, updateDayPhong, deleteDayPhong } from "../controllers/dayphong.js";
import { getAllVatTus, createVatTu, updateVatTu, deleteVatTu } from "../controllers/vattu.js";
import { getAllChiSos, getLatestChiSoByPhong, getChiSoLookupByPhong, createChiSo, deleteAllChiSos, deleteChiSo } from "../controllers/chisodiennuoc.js";
import { getLatestGia, updateGia, getAllGias, deleteGia } from "../controllers/giadiennuoc.js";
import { createYeuCau, getAllYeuCaus, confirmYeuCau, cancelYeuCau, updateYeuCau, deleteYeuCau } from "../controllers/datphong.js";
import { createSlot, getAllSlots, deleteSlot, cleanupOldSlots } from "../controllers/lichxemphong.js";
import { auth } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";
import { getLatestCauHinh, updateCauHinh } from "../controllers/cauhinh.js";
import { createYeuCauBaoTri, getAllYeuCauBaoTri, getYeuCauBaoTriByKhach, updateTrangThaiBaoTri, deleteYeuCauBaoTri } from "../controllers/baotri.js";
import { handleSePayWebhook, parseSePayWebhookBody, sepayRateLimit } from "../controllers/sepayWebhook.js";
import {
    exportPaymentsCsv,
    generateInvoicesByMonth,
    getInvoiceStatusByCode,
    getInvoicesForLandlord,
    getPaymentsReport,
    getPublicInvoiceByCode,
    getRevenueStatistics
} from "../controllers/payments.js";
const router = express.Router();

// Public webhooks
router.post("/webhook/sepay", parseSePayWebhookBody, sepayRateLimit, handleSePayWebhook);
router.post("/payments/webhook", parseSePayWebhookBody, sepayRateLimit, handleSePayWebhook);

// Public invoice status routes
router.get("/invoices/:code/status", getInvoiceStatusByCode);
router.get("/invoices/:code/public", getPublicInvoiceByCode);

// Auth routes
router.post("/auth/login", login);
router.post("/auth/register", register);
router.post("/auth/refresh", refreshAccessToken);
router.get("/auth/me", auth(), getMe);
router.put("/auth/me", auth(), upload.single("avatar"), updateMe);
router.get("/auth/users", auth(["Chu_Tro"]), getAllUsers);
router.put("/auth/change-password", auth(), changePassword);

// Admin routes - chỉ Chu_Tro mới truy cập được
router.get("/admin/dashboard", auth(["Chu_Tro"]), (req, res) => {
    res.json({
        message: "Chào mừng đến trang quản trị",
        stats: {
            tongPhong: 0,
            phongTrong: 0,
            tongHopDong: 0,
            tongHoaDon: 0,
        },
    });
});

// Phong routes
router.get("/phong", auth(), getAllPhongs);
router.get("/phong/:id", auth(), getPhongById);
router.post("/phong", auth(["Chu_Tro"]), upload.array("hinhAnh", 10), createPhong);
router.put("/phong/:id", auth(["Chu_Tro"]), upload.array("hinhAnh", 10), updatePhong);
router.delete("/phong/:id", auth(["Chu_Tro"]), deletePhong);


// HopDong routes
router.get("/hopdong", auth(), getAllHopDongs);
router.post("/hopdong", auth(["Chu_Tro"]), createHopDong);
router.put("/hopdong/:id", auth(["Chu_Tro"]), updateHopDong);
router.put("/hopdong/:id/extend", auth(["Chu_Tro"]), extendHopDong);
router.delete("/hopdong/:id", auth(["Chu_Tro"]), deleteHopDong);

// HoaDon routes
router.get("/hoadon", auth(), getAllHoaDons);
router.post("/hoadon", auth(["Chu_Tro"]), createHoaDon);
router.put("/hoadon/:id", auth(["Chu_Tro"]), updateHoaDon);
router.delete("/hoadon/:id", auth(["Chu_Tro"]), deleteHoaDon);
router.post("/hoadon/:id/request-payment", auth(["Chu_Tro"]), requestPayment);
router.post("/invoices/generate", auth(["Chu_Tro"]), generateInvoicesByMonth);
router.get("/invoices", auth(["Chu_Tro"]), getInvoicesForLandlord);
router.get("/payments/report", auth(["Chu_Tro"]), getPaymentsReport);
router.get("/payments/export", auth(["Chu_Tro"]), exportPaymentsCsv);
router.get("/payments/statistics", auth(["Chu_Tro"]), getRevenueStatistics);


// DayPhong routes
router.get("/dayphong", auth(), getAllDayPhongs);
router.post("/dayphong", auth(["Chu_Tro"]), upload.single("hinhAnh"), createDayPhong);
router.put("/dayphong/:id", auth(["Chu_Tro"]), upload.single("hinhAnh"), updateDayPhong);
router.delete("/dayphong/:id", auth(["Chu_Tro"]), deleteDayPhong);

// VatTu routes
router.get("/vattu", auth(), getAllVatTus);
router.post("/vattu", auth(["Chu_Tro"]), createVatTu);
router.put("/vattu/:id", auth(["Chu_Tro"]), updateVatTu);
router.delete("/vattu/:id", auth(["Chu_Tro"]), deleteVatTu);

// Utility routes
router.get("/chisodiennuoc", auth(["Chu_Tro", "Khach"]), getAllChiSos);
router.get("/chisodiennuoc/latest/:idPhong", auth(["Chu_Tro", "Khach"]), getLatestChiSoByPhong);
router.get("/chisodiennuoc/lookup/:idPhong", auth(["Chu_Tro", "Khach"]), getChiSoLookupByPhong);
router.post("/chisodiennuoc", auth(["Chu_Tro"]), createChiSo);
router.delete("/chisodiennuoc/delete-all", auth(["Chu_Tro"]), deleteAllChiSos);
router.delete("/chisodiennuoc/:id", auth(["Chu_Tro"]), deleteChiSo);

router.get("/giadiennuoc/latest", auth(), getLatestGia);
router.get("/giadiennuoc/history", auth(), getAllGias);
router.post("/giadiennuoc", auth(["Chu_Tro"]), updateGia);
router.delete("/giadiennuoc/:id", auth(["Chu_Tro"]), deleteGia);

// Booking routes
router.get("/datphong", auth(), getAllYeuCaus);
router.post("/datphong", auth(["Khach"]), createYeuCau);
router.put("/datphong/:id/confirm", auth(["Chu_Tro"]), confirmYeuCau);
router.put("/datphong/:id", auth(["Chu_Tro"]), updateYeuCau);
router.delete("/datphong/:id", auth(["Chu_Tro"]), deleteYeuCau);
router.put("/datphong/:id/cancel", auth(), cancelYeuCau);

// LichXemPhong routes
router.get("/lich-xem-phong", auth(), getAllSlots);
router.post("/lich-xem-phong", auth(["Chu_Tro"]), createSlot);
router.delete("/lich-xem-phong/cleanup/old", auth(["Chu_Tro"]), cleanupOldSlots);
router.delete("/lich-xem-phong/:id", auth(["Chu_Tro"]), deleteSlot);

// CauHinh routes
router.get("/cauhinh/latest", auth(), getLatestCauHinh);
router.put("/cauhinh", auth(["Chu_Tro"]), updateCauHinh);

// BaoTri routes
router.get("/baotri", auth(["Chu_Tro"]), getAllYeuCauBaoTri);
router.get("/baotri/me", auth(["Khach"]), getYeuCauBaoTriByKhach);
router.post("/baotri", auth(["Khach"]), upload.single("hinhAnh"), createYeuCauBaoTri);
router.put("/baotri/:id", auth(["Chu_Tro"]), updateTrangThaiBaoTri);
router.delete("/baotri/:id", auth(["Chu_Tro", "Khach"]), deleteYeuCauBaoTri);

export default router;
