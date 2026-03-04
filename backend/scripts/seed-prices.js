import mongoose from "mongoose";
import dotenv from "dotenv";
import GiaDienVaNuoc from "../src/models/GiaDienVaNuoc.js";

dotenv.config();

const seedPrices = async () => {
    try {
        await mongoose.connect(process.env.MONGOOSE_URI);
        console.log("Connected to MongoDB");

        const newGia = new GiaDienVaNuoc({
            ngayApDung: new Date(),
            giaDien: 3500,
            giaNuoc: 15000
        });

        await newGia.save();
        console.log("Successfully seeded utility prices: 3,500 VND/kWh, 15,000 VND/m3");

        await mongoose.connection.close();
    } catch (error) {
        console.error("Error seeding prices:", error);
        process.exit(1);
    }
};

seedPrices();
