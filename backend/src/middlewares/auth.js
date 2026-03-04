import jwt from "jsonwebtoken";

export const auth = (roles = []) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.sendStatus(401);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const rawRole = (decoded.role || decoded.vaiTro || "").toString().trim();
      const userRole = rawRole;

      // So sánh không phân biệt hoa thường (Case-insensitive)
      const hasPermission = roles.length === 0 || roles.some(r => r.toLowerCase() === rawRole.toLowerCase());

      if (!hasPermission) {
        return res.status(403).json({
          message: "Bạn không có quyền thực hiện hành động này",
          detail: `Tài khoản mang vai trò "${userRole}", nhưng cần: ${roles.join(", ")}`,
          userRole
        });
      }

      req.user = decoded;
      req.user.vaiTro = userRole;

      next();
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  };
};
