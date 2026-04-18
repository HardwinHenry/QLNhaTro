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
        const { ngayApDung } = req.body;
        
        // Validation: New applied date cannot be before the existing latest applied date
        const latest = await GiaDienVaNuoc.findOne().sort({ ngayApDung: -1 });
        
        if (latest && new Date(ngayApDung) < new Date(latest.ngayApDung)) {
            const lastDate = new Date(latest.ngayApDung).toLocaleDateString("vi-VN");
            return res.status(400).json({ 
                message: `Ngày áp dụng mới không được trước ngày áp dụng gần nhất (${lastDate})` 
            });
        }

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

export const deleteGia = async (req, res) => {
    try {
        const { id } = req.params;
        await GiaDienVaNuoc.findByIdAndDelete(id);
        res.json({ message: "Xóa lịch sử giá thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
