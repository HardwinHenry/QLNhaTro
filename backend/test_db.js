import "dotenv/config";
import { connectDB } from "./src/libs/db.js";
import YeuCauDatPhong from "./src/models/YeuCauDatPhong.js";

connectDB().then(async () => {
    try {
        const list = await YeuCauDatPhong.find().limit(1);
        console.log("Bookings in DB:", list);
        if (list.length > 0) {
            console.log("Try updating the first one...");
            const id = list[0]._id;
            const yeuCau = await YeuCauDatPhong.findById(id);
            yeuCau.ghiChu = "Test notes";
            await yeuCau.save();
            console.log("Update success!");
        }
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
});
