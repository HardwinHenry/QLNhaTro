import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import "dotenv/config";

const nukeUtilities = async () => {
    try {
        const uri = process.env.MONGOOSE_URI;
        await mongoose.connect(uri);
        const result = await mongoose.connection.db.collection("chisodienvanuocs").deleteMany({});
        console.log(`Deleted ${result.deletedCount} utility readings.`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

nukeUtilities();
