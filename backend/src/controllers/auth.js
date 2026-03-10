import User from "../models/User.js";
import HopDong from "../models/HopDong.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { tenDangNhap, matKhau, vaiTro, hoVaTen, sdt, cccd } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ tenDangNhap });
    if (existingUser) {
      return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
    }

    const hash = await bcrypt.hash(matKhau, 10);

    const user = await User.create({
      tenDangNhap,
      matKhau: hash,
      vaiTro,
      hoVaTen,
      sdt,
      cccd
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message || "Lỗi khi đăng ký tài khoản" });
  }
};

export const login = async (req, res) => {
  const { tenDangNhap, matKhau } = req.body;

  // Find user by username OR phone number
  const user = await User.findOne({
    $or: [
      { tenDangNhap: tenDangNhap },
      { sdt: tenDangNhap }
    ]
  });

  if (!user) return res.status(400).json({ message: "Sai tài khoản hoặc số điện thoại" });

  const ok = await bcrypt.compare(matKhau, user.matKhau);

  if (!ok) return res.status(400).json({ message: "Sai mật khẩu" });

  const accessToken = jwt.sign(
    { id: user._id, role: user.vaiTro },
    process.env.JWT_SECRET
  );

  res.json({
    accessToken,
    user
  });
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-matKhau").lean();
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

    // Find active contract to get room info
    const activeContract = await HopDong.findOne({
      idKhach: user._id,
      trangThai: "Con_Hieu_Luc"
    }).populate("idPhong");

    if (activeContract && activeContract.idPhong) {
      user.phongHienTai = activeContract.idPhong;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refreshAccessToken = async (req, res) => {
  // Simple implementation for now
  res.json({ message: "Refresh token logic to be implemented" });
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-matKhau").lean();

    // Add room info for each user
    const usersWithRoom = await Promise.all(users.map(async (user) => {
      const activeContract = await HopDong.findOne({
        idKhach: user._id,
        trangThai: "Con_Hieu_Luc"
      }).populate("idPhong");

      if (activeContract && activeContract.idPhong) {
        return { ...user, phongHienTai: activeContract.idPhong };
      }
      return user;
    }));

    res.json(usersWithRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { hoVaTen, sdt, cccd } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { hoVaTen, sdt, cccd },
      { new: true }
    ).select("-matKhau");

    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message || "Lỗi khi cập nhật hồ sơ" });
  }
};
