import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import "dotenv/config";

const listCollections = async () => {
    try {
        const uri = process.env.MONGOOSE_URI;
        await mongoose.connect(uri);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(collections.map(c => c.name));
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listCollections();
