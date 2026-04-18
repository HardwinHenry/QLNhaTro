import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Phong from './src/models/Phong.js';

dotenv.config();

const nukeImages = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGOOSE_URI);
        console.log('Connected.');

        console.log('Updating all rooms to clear hinhAnh array...');
        const result = await Phong.updateMany({}, { $set: { hinhAnh: [] } });
        
        console.log(`Successfully updated ${result.modifiedCount} rooms.`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error nuking images:', error);
        process.exit(1);
    }
};

nukeImages();
