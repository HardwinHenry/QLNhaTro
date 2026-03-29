import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";
import "dotenv/config";

const checkStatus = async () => {
    try {
        const uri = process.env.MONGOOSE_URI;
        await mongoose.connect(uri);
        console.log("Connected to DB:", mongoose.connection.name);
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (let col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments({});
            console.log(`Collection: ${col.name}, Count: ${count}`);
        }
        
        const hoadons = await mongoose.connection.db.collection("hoadons").find({}).toArray();
        console.log("Hoadons:", JSON.stringify(hoadons, null, 2));
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkStatus();
