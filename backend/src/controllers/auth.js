import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { tenDangNhap, matKhau, vaiTro } = req.body;

  const hash = await bcrypt.hash(matKhau, 10);

  const user = await User.create({
    tenDangNhap,
    matKhau: hash,
    vaiTro
  });

  res.json(user);
};

export const login = async (req, res) => {
  const { tenDangNhap, matKhau } = req.body;

  const user = await User.findOne({ tenDangNhap });

  if (!user) return res.status(400).json("Sai tài khoản");

  const ok = await bcrypt.compare(matKhau, user.matKhau);

  if (!ok) return res.status(400).json("Sai mật khẩu");

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
    const user = await User.findById(req.user.id).select("-matKhau");
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });
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
    const users = await User.find().select("-matKhau");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

