import User from "../models/user.model.js";
import { generateTokens, storeRefreshToken } from "../lib/token.js";
import { setCookies, clearCookies } from "../lib/cookie.js"; // Đảm bảo bạn đã thêm hàm clearCookies
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";
import { errorHandler } from "../utils/error.js";
// 1. ĐĂNG KÝ
export const register = async (req, res, next) => {
  try {
    const { fullName, email, password, username, dateOfBirth } = req.body;

    // Validate cơ bản
    if (!fullName || !email || !password || !username || !dateOfBirth) {
      throw errorHandler(400, "Vui lòng điền đầy đủ thông tin");
    }
    if (password.length < 6) {
      throw errorHandler(400, "Mật khẩu phải có ít nhất 6 ký tự");
    }

    // Kiểm tra user tồn tại (email hoặc username)
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      throw errorHandler(400, "Email hoặc Username đã tồn tại");
    }

    // Tạo user mới
    const user = await User.create({
      fullName,
      email,
      password, // Password sẽ được hash tự động bởi pre-save hook trong Model
      username,
      dateOfBirth,
    });

    // Tạo Token & Lưu Redis
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);

    // Gán Cookie
    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. ĐĂNG NHẬP
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Tìm user và lấy cả password (vì trong model ta để select: false)
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      throw errorHandler(400, "Email hoặc mật khẩu không chính xác");
    }

    // Kiểm tra nếu user bị Ban
    if (user.isBanned) {
      throw errorHandler(
        403,
        `Tài khoản đã bị khóa. Lý do: ${
          user.banReason || "Vi phạm chính sách"
        }`
      );
    }

    // Tạo Token & Lưu Redis
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);

    // Gán Cookie
    setCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. ĐĂNG XUẤT
export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET
        );
        // Xóa token khỏi Redis để chặn truy cập ngay lập tức
        await redis.del(`refresh_token:${decoded.userId}`);
      } catch (error) {
        // Nếu token lỗi hoặc hết hạn thì cứ bỏ qua và xóa cookie
        console.log(
          "Logout: Token invalid or expired, clearing cookies anyway"
        );
      }
    }

    // Xóa Cookie trình duyệt
    clearCookies(res);

    res.status(200).json({ success: true, message: "Đăng xuất thành công" });
  } catch (error) {
    next(error);
  }
};

// 4. REFRESH TOKEN (Cấp lại Access Token mới)
export const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw errorHandler(401, "No refresh token provided");
    }

    // Verify token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Kiểm tra token có khớp với Redis không (Chống dùng token cũ/đã logout)
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
    if (storedToken !== refreshToken) {
      throw errorHandler(401, "Invalid refresh token");
    }

    // Tạo cặp token MỚI (Token Rotation - Tăng bảo mật)
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      decoded.userId
    );

    // Cập nhật lại Redis
    await storeRefreshToken(decoded.userId, newRefreshToken);

    // Cập nhật lại Cookie
    setCookies(res, accessToken, newRefreshToken);

    res
      .status(200)
      .json({ success: true, message: "Token refreshed successfully" });
  } catch (error) {
    console.log("Error in refresh token controller", error.message);
    // Nếu lỗi (token hết hạn...), xóa cookie để user đăng nhập lại
    clearCookies(res);
    throw errorHandler(401, "Refresh token expired or invalid");
  }
};
