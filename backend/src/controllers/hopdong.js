import HopDong from "../models/HopDong.js";
import Phong from "../models/Phong.js";
import GiaDienVaNuoc from "../models/GiaDienVaNuoc.js";

export const getAllHopDongs = async (req, res) => {
    try {
        const query = req.user.role === "Chu_Tro" ? {} : { idKhach: req.user.id };
        const hopDongs = await HopDong.find(query).populate({
            path: "idPhong",
            populate: { path: "idDayPhong vatTu" }
        }).populate("idKhach");
        res.json(hopDongs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createHopDong = async (req, res) => {
    try {
        const body = { ...req.body };

        // Nếu không có giá điện nước trong body, lấy giá mới nhất
        if (!body.giaDien || !body.giaNuoc) {
            const latestGia = await GiaDienVaNuoc.findOne().sort({ ngayApDung: -1 });
            if (latestGia) {
                if (!body.giaDien) body.giaDien = latestGia.giaDien;
                if (!body.giaNuoc) body.giaNuoc = latestGia.giaNuoc;
            }
        }

        const newHopDong = new HopDong(body);
        await newHopDong.save();

        // Cập nhật trạng thái phòng
        await Phong.findByIdAndUpdate(req.body.idPhong, { trangThai: "Da_Thue" });

        res.status(201).json(newHopDong);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateHopDong = async (req, res) => {
    try {
        const { id } = req.params;
        const hopDong = await HopDong.findById(id);

        if (!hopDong) {
            return res.status(404).json({ message: "Không tìm thấy hợp đồng" });
        }

        const updatedHopDong = await HopDong.findByIdAndUpdate(id, req.body, { new: true });

        // Nếu cập nhật trạng thái thành Ket_Thuc, giải phóng phòng
        if (req.body.trangThai === "Ket_Thuc") {
            await Phong.findByIdAndUpdate(hopDong.idPhong, { trangThai: "Trong" });
        }

        res.json(updatedHopDong);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const extendHopDong = async (req, res) => {
    try {
        const { id } = req.params;
        const { ngayKetThucMoi } = req.body;

        const hopDong = await HopDong.findById(id);
        if (!hopDong) {
            return res.status(404).json({ message: "Không tìm thấy hợp đồng" });
        }

        hopDong.ngayKetThuc = ngayKetThucMoi;
        hopDong.trangThai = "Con_Hieu_Luc"; // Đảm bảo hợp đồng vẫn còn hiệu lực khi gia hạn
        await hopDong.save();

        res.json({ message: "Gia hạn hợp đồng thành công", hopDong });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteHopDong = async (req, res) => {
    try {
        const hopDong = await HopDong.findById(req.params.id);
        if (hopDong) {
            // Chỉ reset trạng thái phòng nếu hợp đồng đang còn hiệu lực
            if (hopDong.trangThai === "Con_Hieu_Luc") {
                await Phong.findByIdAndUpdate(hopDong.idPhong, { trangThai: "Trong" });
            }
            await HopDong.findByIdAndDelete(req.params.id);
        }
        res.json({ message: "Xóa hợp đồng thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

