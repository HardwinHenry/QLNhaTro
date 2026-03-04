import DayPhong from "../models/DayPhong.js";

export const getAllDayPhongs = async (req, res) => {
    try {
        const result = await DayPhong.find().sort({ tang: 1, soDay: 1 });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createDayPhong = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.hinhAnh = `/uploads/${req.file.filename}`;
        }
        const newDayPhong = new DayPhong(data);
        await newDayPhong.save();
        res.status(201).json(newDayPhong);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};


export const updateDayPhong = async (req, res) => {
    const { id } = req.params;
    try {
        const data = { ...req.body };
        if (req.file) {
            data.hinhAnh = `/uploads/${req.file.filename}`;
        }
        const updated = await DayPhong.findByIdAndUpdate(id, data, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(404).json({ message: "DayPhong not found" });
    }
};

export const deleteDayPhong = async (req, res) => {
    const { id } = req.params;
    try {
        await DayPhong.findByIdAndDelete(id);
        res.json({ message: "DayPhong deleted successfully" });
    } catch (error) {
        res.status(404).json({ message: "DayPhong not found" });
    }
};
