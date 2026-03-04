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

export const createChiSo = async (req, res) => {
    try {
        const newChiSo = new ChiSoDienVaNuoc(req.body);
        await newChiSo.save();
        res.status(201).json(newChiSo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
