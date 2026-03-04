import mongoose from "mongoose";
import dotenv from "dotenv";
import DayPhong from "../src/models/DayPhong.js";
import VatTu from "../src/models/VatTu.js";
import Phong from "../src/models/Phong.js";

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGOOSE_URI);
        console.log("✅ Connected to MongoDB");

        // --- 1. Seed DayPhong ---
        const existingDayPhongs = await DayPhong.countDocuments();
        let dayPhongs;
        if (existingDayPhongs > 0) {
            console.log(`⏩ DayPhong đã có ${existingDayPhongs} bản ghi, bỏ qua.`);
            dayPhongs = await DayPhong.find();
        } else {
            dayPhongs = await DayPhong.insertMany([
                { soDay: 1, viTri: "Tầng trệt - Dãy A" },
                { soDay: 2, viTri: "Tầng trệt - Dãy B" },
                { soDay: 3, viTri: "Tầng 1 - Dãy A" },
                { soDay: 4, viTri: "Tầng 1 - Dãy B" },
            ]);
            console.log(`✅ Đã thêm ${dayPhongs.length} dãy phòng`);
        }

        // --- 2. Seed VatTu ---
        const existingVatTus = await VatTu.countDocuments();
        let vatTus;
        if (existingVatTus > 0) {
            console.log(`⏩ VatTu đã có ${existingVatTus} bản ghi, bỏ qua.`);
            vatTus = await VatTu.find();
        } else {
            vatTus = await VatTu.insertMany([
                { tenVatTu: "Máy lạnh", donGia: 3500000 },
                { tenVatTu: "Tủ lạnh", donGia: 2000000 },
                { tenVatTu: "Máy giặt", donGia: 4000000 },
                { tenVatTu: "Bình nóng lạnh", donGia: 1500000 },
                { tenVatTu: "Giường", donGia: 800000 },
                { tenVatTu: "Tủ quần áo", donGia: 600000 },
                { tenVatTu: "Bàn học", donGia: 400000 },
                { tenVatTu: "Quạt trần", donGia: 350000 },
            ]);
            console.log(`✅ Đã thêm ${vatTus.length} vật tư`);
        }

        // --- 3. Seed Phong ---
        const existingPhongs = await Phong.countDocuments();
        if (existingPhongs > 0) {
            console.log(`⏩ Phong đã có ${existingPhongs} bản ghi, bỏ qua.`);
        } else {
            const rooms = [
                {
                    idPhong: "P101",
                    tenPhong: "Phòng 101",
                    idDayPhong: dayPhongs[0]._id,
                    giaPhong: 2500000,
                    dienTich: 20,
                    sucChua: 2,
                    loaiPhong: "Phong_Don",
                    trangThai: "Trong",
                    hinhAnh: "/Phong01.jpg",
                    moTa: "Phòng đơn thoáng mát, gần cổng chính",
                    vatTu: [vatTus[0]._id, vatTus[4]._id, vatTus[7]._id],
                },
                {
                    idPhong: "P102",
                    tenPhong: "Phòng 102",
                    idDayPhong: dayPhongs[0]._id,
                    giaPhong: 3000000,
                    dienTich: 25,
                    sucChua: 2,
                    loaiPhong: "Phong_Don",
                    trangThai: "Da_Thue",
                    hinhAnh: "/Phong02.jpg",
                    moTa: "Phòng đơn có ban công, view đẹp",
                    vatTu: [vatTus[0]._id, vatTus[1]._id, vatTus[4]._id, vatTus[6]._id],
                },
                {
                    idPhong: "P103",
                    tenPhong: "Phòng 103",
                    idDayPhong: dayPhongs[0]._id,
                    giaPhong: 3500000,
                    dienTich: 30,
                    sucChua: 3,
                    loaiPhong: "Phong_Doi",
                    trangThai: "Trong",
                    hinhAnh: "/Phong03.jpg",
                    moTa: "Phòng đôi rộng rãi, phù hợp cho cặp đôi",
                    vatTu: [vatTus[0]._id, vatTus[1]._id, vatTus[3]._id, vatTus[4]._id, vatTus[5]._id],
                },
                {
                    idPhong: "P201",
                    tenPhong: "Phòng 201",
                    idDayPhong: dayPhongs[1]._id,
                    giaPhong: 2800000,
                    dienTich: 22,
                    sucChua: 2,
                    loaiPhong: "Phong_Don",
                    trangThai: "Da_Thue",
                    hinhAnh: "/Phong04.jpg",
                    moTa: "Phòng đơn yên tĩnh, thích hợp cho sinh viên",
                    vatTu: [vatTus[3]._id, vatTus[4]._id, vatTus[6]._id, vatTus[7]._id],
                },
                {
                    idPhong: "P202",
                    tenPhong: "Phòng 202",
                    idDayPhong: dayPhongs[1]._id,
                    giaPhong: 4000000,
                    dienTich: 35,
                    sucChua: 4,
                    loaiPhong: "Phong_Ghep",
                    trangThai: "Trong",
                    hinhAnh: "/Phong05.jpg",
                    moTa: "Phòng ghép cho nhóm bạn, tiết kiệm chi phí",
                    vatTu: [vatTus[0]._id, vatTus[2]._id, vatTus[4]._id, vatTus[5]._id, vatTus[7]._id],
                },
                {
                    idPhong: "P203",
                    tenPhong: "Phòng 203",
                    idDayPhong: dayPhongs[1]._id,
                    giaPhong: 2200000,
                    dienTich: 18,
                    sucChua: 1,
                    loaiPhong: "Phong_Don",
                    trangThai: "Trong",
                    hinhAnh: "/Phong06.jpg",
                    moTa: "Phòng đơn nhỏ gọn, giá rẻ",
                    vatTu: [vatTus[4]._id, vatTus[7]._id],
                },
                {
                    idPhong: "P301",
                    tenPhong: "Phòng 301",
                    idDayPhong: dayPhongs[2]._id,
                    giaPhong: 5000000,
                    dienTich: 40,
                    sucChua: 2,
                    loaiPhong: "Phong_VIP",
                    trangThai: "Da_Thue",
                    hinhAnh: "/Phong07.jpg",
                    moTa: "Phòng VIP nội thất cao cấp, đầy đủ tiện nghi",
                    vatTu: [vatTus[0]._id, vatTus[1]._id, vatTus[2]._id, vatTus[3]._id, vatTus[4]._id, vatTus[5]._id, vatTus[6]._id],
                },
                {
                    idPhong: "P302",
                    tenPhong: "Phòng 302",
                    idDayPhong: dayPhongs[2]._id,
                    giaPhong: 3200000,
                    dienTich: 28,
                    sucChua: 2,
                    loaiPhong: "Phong_Doi",
                    trangThai: "Trong",
                    hinhAnh: "/Phong08.jpg",
                    moTa: "Phòng đôi tầng 1, thuận tiện di chuyển",
                    vatTu: [vatTus[0]._id, vatTus[3]._id, vatTus[4]._id, vatTus[5]._id],
                },
                {
                    idPhong: "P401",
                    tenPhong: "Phòng 401",
                    idDayPhong: dayPhongs[3]._id,
                    giaPhong: 3800000,
                    dienTich: 32,
                    sucChua: 3,
                    loaiPhong: "Phong_Ghep",
                    trangThai: "Da_Thue",
                    hinhAnh: "/Phong10.jpg",
                    moTa: "Phòng ghép 3 người, có bếp riêng",
                    vatTu: [vatTus[0]._id, vatTus[1]._id, vatTus[2]._id, vatTus[4]._id, vatTus[7]._id],
                },
                {
                    idPhong: "P402",
                    tenPhong: "Phòng 402",
                    idDayPhong: dayPhongs[3]._id,
                    giaPhong: 5500000,
                    dienTich: 45,
                    sucChua: 2,
                    loaiPhong: "Phong_VIP",
                    trangThai: "Trong",
                    hinhAnh: "/Phong11.jpg",
                    moTa: "Phòng VIP rộng nhất, ban công lớn, nội thất sang trọng",
                    vatTu: [vatTus[0]._id, vatTus[1]._id, vatTus[2]._id, vatTus[3]._id, vatTus[4]._id, vatTus[5]._id, vatTus[6]._id, vatTus[7]._id],
                },
                {
                    idPhong: "P303",
                    tenPhong: "Phòng 303",
                    idDayPhong: dayPhongs[2]._id,
                    giaPhong: 2600000,
                    dienTich: 20,
                    sucChua: 2,
                    loaiPhong: "Phong_Don",
                    trangThai: "Trong",
                    hinhAnh: "/Phong12.jpg",
                    moTa: "Phòng đơn sáng sủa, cửa sổ lớn",
                    vatTu: [vatTus[0]._id, vatTus[4]._id, vatTus[6]._id],
                },
                {
                    idPhong: "P403",
                    tenPhong: "Phòng 403",
                    idDayPhong: dayPhongs[3]._id,
                    giaPhong: 3400000,
                    dienTich: 28,
                    sucChua: 2,
                    loaiPhong: "Phong_Doi",
                    trangThai: "Da_Thue",
                    hinhAnh: "/Phong13.jpg",
                    moTa: "Phòng đôi ấm cúng, gần khu vực giặt chung",
                    vatTu: [vatTus[0]._id, vatTus[1]._id, vatTus[3]._id, vatTus[4]._id],
                },
            ];

            const insertedPhongs = await Phong.insertMany(rooms);
            console.log(`✅ Đã thêm ${insertedPhongs.length} phòng trọ`);
        }

        console.log("\n🎉 Seed dữ liệu hoàn tất!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi khi seed dữ liệu:", error);
        process.exit(1);
    }
};

seedData();
