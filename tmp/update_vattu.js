import mongoose from "mongoose";
import dotenv from "dotenv";
import VatTu from "../backend/src/models/VatTu.js";

dotenv.config({ path: "../backend/.env" });

const updateVatTu = async () => {
    try {
        await mongoose.connect(process.env.MONGOOSE_URI);
        console.log("Connected to MongoDB");

        const mappings = [
            { old: "May lanh", new: "Máy lạnh" },
            { old: "Tu lanh", new: "Tủ lạnh" },
            { old: "May giat", new: "Máy giặt" },
            { old: "Binh nong lanh", new: "Bình nóng lạnh" },
            { old: "Giuong", new: "Giường" },
            { old: "Tu quan ao", new: "Tủ quần áo" },
            { old: "Ban hoc", new: "Bàn học" },
            { old: "Quat tran", new: "Quạt trần" },
            { old: "May lanh, Giuong, Quat tran", new: "Máy lạnh, Giường, Quạt trần" }
        ];

        for (const mapping of mappings) {
            const result = await VatTu.updateMany(
                { tenVatTu: mapping.old },
                { $set: { tenVatTu: mapping.new } }
            );
            if (result.modifiedCount > 0) {
                console.log(`Updated ${mapping.old} -> ${mapping.new} (${result.modifiedCount} records)`);
            }
        }

        // Also handle cases where they were entered with different case or minor variations if possible
        // But for now, exact matches from common non-accented patterns

        console.log("Update completed!");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

updateVatTu();
