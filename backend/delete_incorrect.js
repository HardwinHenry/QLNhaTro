import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import "dotenv/config";

const deleteIncorrectInvoice = async () => {
    try {
        const uri = process.env.MONGOOSE_URI;
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");
        
        // Find and delete the invoice for February 2026
        const startOfFeb = new Date(2026, 1, 1);
        const endOfFeb = new Date(2026, 2, 0, 23, 59, 59);

        const result = await mongoose.connection.db.collection("hoadons").deleteMany({
            ngayThangNam: { $gte: startOfFeb, $lte: endOfFeb }
        });
        
        console.log(`Deleted ${result.deletedCount} incorrect invoices.`);
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

deleteIncorrectInvoice();
