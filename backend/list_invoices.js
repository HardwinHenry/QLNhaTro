import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import "dotenv/config";

const listInvoices = async () => {
    try {
        const uri = process.env.MONGOOSE_URI;
        await mongoose.connect(uri);
        const invoices = await mongoose.connection.db.collection("hoadons").find({}).toArray();
        console.log(JSON.stringify(invoices, null, 2));
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listInvoices();
