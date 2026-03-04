import VatTu from "../models/VatTu.js";

export const getAllVatTus = async (req, res) => {
    try {
        const result = await VatTu.find();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createVatTu = async (req, res) => {
    const data = req.body;
    const newVatTu = new VatTu(data);
    try {
        await newVatTu.save();
        res.status(201).json(newVatTu);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

export const updateVatTu = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
        const updated = await VatTu.findByIdAndUpdate(id, data, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(404).json({ message: "VatTu not found" });
    }
};

export const deleteVatTu = async (req, res) => {
    const { id } = req.params;
    try {
        await VatTu.findByIdAndDelete(id);
        res.json({ message: "VatTu deleted successfully" });
    } catch (error) {
        res.status(404).json({ message: "VatTu not found" });
    }
};
