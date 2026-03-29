import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import "dotenv/config";

const fix = async () => {
    try {
        const uri = process.env.MONGOOSE_URI;
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        
        const hoadons = await db.collection("hoadons").find({}).toArray();
        console.log("Count found:", hoadons.length);
        
        if (hoadons.length > 0) {
            for (let doc of hoadons) {
                console.log("Deleting:", doc._id);
            }
            const res = await db.collection("hoadons").deleteMany({});
            console.log("Deleted:", res.deletedCount);
        } else {
            console.log("No hoadons to delete.");
        }
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

fix();
