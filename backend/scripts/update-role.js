import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const updateRole = async () => {
    try {
        const uri = process.env.MONGOOSE_URI || "mongodb+srv://trantruongdangkhoa2005_db_user:Cq8OZj1huk27JEdd@cluster0.dh4tnsz.mongodb.net/?appName=Cluster0";
        console.log('Connecting to:', uri.split('@')[1]); // Log only the host part for safety

        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const result = await User.updateMany(
            { vaiTro: 'quan_ly' },
            { vaiTro: 'Chu_Tro' }
        );

        console.log(`Successfully updated ${result.modifiedCount} users to Chu_Tro`);

        // Also check if 'quanly' exists specifically
        const quanlyUser = await User.findOne({ tenDangNhap: 'quanly' });
        if (quanlyUser) {
            console.log('User "quanly" current role:', quanlyUser.vaiTro);
            if (quanlyUser.vaiTro !== 'Chu_Tro') {
                quanlyUser.vaiTro = 'Chu_Tro';
                await quanlyUser.save();
                console.log('User "quanly" forced to Chu_Tro');
            }
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error updating user role:', error);
        process.exit(1);
    }
};

updateRole();
