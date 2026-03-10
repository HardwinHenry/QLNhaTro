import express from "express";
import { login, register, getMe, refreshAccessToken, getAllUsers, updateMe } from "../controllers/auth.js";
import { getAllPhongs, getPhongById, createPhong, updatePhong, deletePhong } from "../controllers/phong.js";
import { getAllHopDongs, createHopDong, updateHopDong, deleteHopDong, extendHopDong } from "../controllers/hopdong.js";
import { getAllHoaDons, createHoaDon, updateHoaDon, deleteHoaDon, requestPayment } from "../controllers/hoadon.js";
import { getAllDayPhongs, createDayPhong, updateDayPhong, deleteDayPhong } from "../controllers/dayphong.js";
import { getAllVatTus, createVatTu, updateVatTu, deleteVatTu } from "../controllers/vattu.js";
import { getAllChiSos, getLatestChiSoByPhong, createChiSo } from "../controllers/chisodiennuoc.js";
import { getLatestGia, updateGia } from "../controllers/giadiennuoc.js";
import { createYeuCau, getAllYeuCaus, confirmYeuCau, cancelYeuCau, updateYeuCau, deleteYeuCau } from "../controllers/datphong.js";
import { auth } from "../middlewares/auth.js";
import { upload } from "../middlewares/upload.js";


const router = express.Router();

// Auth routes
router.post("/auth/login", login);
router.post("/auth/register", register);
router.post("/auth/refresh", refreshAccessToken);
router.get("/auth/me", auth(), getMe);
router.put("/auth/me", auth(), updateMe);
router.get("/auth/users", auth(["Chu_Tro"]), getAllUsers);

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
router.post("/phong", auth(["Chu_Tro"]), upload.single("hinhAnh"), createPhong);
router.put("/phong/:id", auth(["Chu_Tro"]), upload.single("hinhAnh"), updatePhong);
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
router.post("/chisodiennuoc", auth(["Chu_Tro"]), createChiSo);

router.get("/giadiennuoc/latest", auth(), getLatestGia);
router.post("/giadiennuoc", auth(["Chu_Tro"]), updateGia);

// Booking routes
router.get("/datphong", auth(), getAllYeuCaus);
router.post("/datphong", auth(["Khach"]), createYeuCau);
router.put("/datphong/:id/confirm", auth(["Chu_Tro"]), confirmYeuCau);
router.put("/datphong/:id", auth(["Chu_Tro"]), updateYeuCau);
router.delete("/datphong/:id", auth(["Chu_Tro"]), deleteYeuCau);
router.put("/datphong/:id/cancel", auth(), cancelYeuCau);

router.post("/thanhtoan", auth(["Khach"]), (req, res) => res.json({ message: "Thanh Toan route" }));


export default router;
