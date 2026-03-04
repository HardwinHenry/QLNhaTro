import GiaDienVaNuoc from "../models/GiaDienVaNuoc.js";

export const getLatestGia = async (req, res) => {
    try {
        const latest = await GiaDienVaNuoc.findOne().sort({ ngayApDung: -1 });
        res.json(latest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateGia = async (req, res) => {
    try {
        const newGia = new GiaDienVaNuoc(req.body);
        await newGia.save();
        res.status(201).json(newGia);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
