import HoaDon from "../models/HoaDon.js";
import ThanhToan from "../models/ThanhToan.js";

// Webhook để nhận data từ SePay
export const receiveWebhook = async (req, res) => {
    try {
        // Lấy dữ liệu từ SePay gửi qua Body
        const { id, gateway, transactionDate, accountNumber, subAccount, transferType, transferAmount, accumulated, code, content, referenceCode, description } = req.body;

        console.log("SePay Webhook received:", req.body);

        // Chỉ xử lý các giao dịch chuyển tiền vào (nhận tiền)
        if (transferType !== "in") {
            return res.status(200).json({ success: true, message: "Bỏ qua giao dịch tiền ra." });
        }

        // Nội dung chuyển khoản (content) sẽ chứa _id của Hóa Đơn (bao gồm 24 ký tự hex)
        // Tìm chuỗi 24 ký tự hex trong nội dung (vì độ dài ObjectID mongoose là 24, VD: 65123456789abcdef1234567) 
        const match = content.match(/[a-fA-F0-9]{24}/);
        
        if (!match) {
            console.log("Không tìm thấy ID Hóa Đơn trong nội dung chuyển khoản:", content);
            // Vẫn trả về 200 cho SePay để nó không gọi lại nhiều lần
            return res.status(200).json({ success: true, message: "Không tìm thấy ID." });
        }

        const idHoaDon = match[0];

        // Lấy Hóa Đơn từ Database
        const hoaDon = await HoaDon.findById(idHoaDon);

        if (!hoaDon) {
            console.log("Không tìm thấy Hóa Đơn với ID:", idHoaDon);
            return res.status(200).json({ success: true, message: "Không tìm thấy Hóa Đơn." });
        }

        // Kiểm tra xem số tiền chuyển khoản có khớp hoặc lớn hơn bằng tổng tiền không
        // Nếu chuyển đúng hoặc dư thì mới tính là đã thanh toán xong
        if (Number(transferAmount) >= hoaDon.tongTien) {
            // Update trạng thái hóa đơn
            hoaDon.trangThai = "Da_Thanh_Toan";
            await hoaDon.save();

            // Lưu lịch sử thanh toán vào collection ThanhToan
            const thanhToan = new ThanhToan({
                idHoaDon: hoaDon._id,
                ngayThanhToan: new Date(transactionDate) || new Date(),
                phuongThuc: gateway || "Chuyen_Khoan"
            });
            await thanhToan.save();

            console.log(`Đã cập nhật trạng thái Da_Thanh_Toan cho Hóa Đơn ID: ${hoaDon._id}`);
        } else {
            console.log(`Số tiền chuyển khoản (${transferAmount}) nhỏ hơn tổng tiền hóa đơn (${hoaDon.tongTien}).`);
        }

        // Trả về cho SePay biết là đã nhận thành công để họ không gọi lại
        return res.status(200).json({ success: true, message: "Webhook processed successfully" });

    } catch (error) {
        console.error("Lỗi khi xử lý SePay Webhook:", error);
        // Trả về lỗi 500 thì SePay sẽ thử gọi lại sau
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
