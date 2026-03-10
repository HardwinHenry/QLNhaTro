import Phong from "../models/Phong.js";
import VatTu from "../models/VatTu.js";

export const getAllPhongs = async (req, res) => {
    try {
        const { minPrice, maxPrice, trangThai, loaiPhong, idDayPhong, search, sort } = req.query;
        let query = {};

        // Improved multi-word and amenity search
        if (search) {
            // Escape special regex characters
            const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const searchWords = search.trim().split(/\s+/).filter(word => word.length > 0);

            if (searchWords.length > 0) {
                const searchPattern = searchWords.map(escapeRegex).join("|");
                const regexOptions = "i";

                // Find VatTu matching any of the search words
                const matchingVatTus = await VatTu.find({
                    tenVatTu: { $regex: searchPattern, $options: regexOptions }
                }).select("_id");

                const vatTuIds = matchingVatTus.map(v => v._id);

                query.$or = [
                    { tenPhong: { $regex: searchPattern, $options: regexOptions } },
                    { moTa: { $regex: searchPattern, $options: regexOptions } },
                    { vatTu: { $in: vatTuIds } }
                ];

                // Also search for the exact phrase if it contains spaces (for better match relevance if we had scoring)
                if (search.includes(" ")) {
                    query.$or.push({ tenPhong: { $regex: escapeRegex(search.trim()), $options: regexOptions } });
                }
            }
        }

        // Filtering by Price
        if (minPrice || maxPrice) {
            query.giaPhong = {};
            if (minPrice) query.giaPhong.$gte = Number(minPrice);
            if (maxPrice) query.giaPhong.$lte = Number(maxPrice);
        }

        // Filtering by Status
        if (trangThai) {
            query.trangThai = trangThai;
        }

        // Filtering by Type
        if (loaiPhong) {
            query.loaiPhong = loaiPhong;
        }

        // Filtering by Floor/Row
        if (idDayPhong) {
            query.idDayPhong = idDayPhong;
        }

        let sortOption = {};
        if (sort === "price_asc") {
            sortOption.giaPhong = 1;
        } else if (sort === "price_desc") {
            sortOption.giaPhong = -1;
        }

        const phongs = await Phong.find(query)
            .sort(sortOption)
            .populate("idDayPhong")
            .populate("vatTu");

        res.json(phongs);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPhongById = async (req, res) => {
    try {
        const phong = await Phong.findById(req.params.id)
            .populate("idDayPhong")
            .populate("vatTu");
        if (!phong) {
            return res.status(404).json({ message: "Không tìm thấy phòng" });
        }
        res.json(phong);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createPhong = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.hinhAnh = `/uploads/${req.file.filename}`;
        }
        const newPhong = new Phong(data);
        await newPhong.save();
        res.status(201).json(newPhong);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


export const updatePhong = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.hinhAnh = `/uploads/${req.file.filename}`;
        }
        const updatedPhong = await Phong.findByIdAndUpdate(req.params.id, data, { new: true });
        res.json(updatedPhong);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deletePhong = async (req, res) => {
    try {
        await Phong.findByIdAndDelete(req.params.id);
        res.json({ message: "Xóa phòng thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

