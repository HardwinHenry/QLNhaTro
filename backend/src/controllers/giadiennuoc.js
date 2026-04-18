import GiaDienVaNuoc from "../models/GiaDienVaNuoc.js";

export const getLatestGia = async (req, res) => {
    try {
        const { date } = req.query;
        const referenceDate = date ? new Date(date) : new Date();
        
        const latest = await GiaDienVaNuoc.findOne({
            ngayApDung: { $lte: referenceDate }
        }).sort({ ngayApDung: -1 });
        
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

export const getAllGias = async (req, res) => {
    try {
        const history = await GiaDienVaNuoc.find().sort({ ngayApDung: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
