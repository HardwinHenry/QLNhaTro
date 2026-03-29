import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import "dotenv/config";

const nukeInvoices = async () => {
    try {
        const uri = process.env.MONGOOSE_URI;
        await mongoose.connect(uri);
        const result = await mongoose.connection.db.collection("hoadons").deleteMany({});
        console.log(`Deleted ${result.deletedCount} invoices.`);
        
        const count = await mongoose.connection.db.collection("hoadons").countDocuments({});
        console.log(`Final count: ${count}`);
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

nukeInvoices();
