import Bookmark from "../models/bookmark.model.js";
import Follow from "../models/follow.model.js";
import ReadingHistory from "../models/readingHistory.model.js";
import User from "../models/user.model.js";
import UserPreferences from "../models/userPreferences.model.js";
import { errorHandler } from "../utils/error.js";

// =========================================================================
// 1. QUẢN LÝ PROFILE (CÁ NHÂN)
// =========================================================================

// Lấy thông tin bản thân
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -otpCode -otpExpires"
    );
    if (!user) return next(errorHandler(404, "User not found"));

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// Cập nhật Profile (Text + Avatar)
export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, bio } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return next(errorHandler(404, "User not found"));

    // Cập nhật text
    if (fullName) user.fullName = fullName;
    if (bio) user.bio = bio;

    // Cập nhật Avatar (Nếu có file upload từ Multer Cloudinary)
    // req.file.path là đường dẫn ảnh trên Cloudinary
    if (req.file && req.file.path) {
      user.avatar = req.file.path;
    }

    const updatedUser = await user.save();

    // Loại bỏ password trước khi trả về
    const userObj = updatedUser.toObject();
    delete userObj.password;
    delete userObj.otpCode;

    res.status(200).json({
      success: true,
      message: "Cập nhật hồ sơ thành công",
      data: userObj,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 2. QUẢN LÝ SỞ THÍCH (UserPreferences)
// =========================================================================

export const getUserPreferences = async (req, res, next) => {
  try {
    let prefs = await UserPreferences.findOne({ user: req.user._id });

    // Nếu chưa có, tạo mặc định
    if (!prefs) {
      prefs = await UserPreferences.create({
        user: req.user._id,
        favoriteCategories: [],
        emailNotifications: true,
        pushNotifications: true,
      });
    }

    res.status(200).json({ success: true, data: prefs });
  } catch (error) {
    next(error);
  }
};

export const updateUserPreferences = async (req, res, next) => {
  try {
    const { favoriteCategories, emailNotifications, pushNotifications } =
      req.body;

    const prefs = await UserPreferences.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          favoriteCategories,
          emailNotifications,
          pushNotifications,
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Cập nhật sở thích thành công",
      data: prefs,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 3. TƯƠNG TÁC: HISTORY, BOOKMARK, FOLLOW
// =========================================================================

export const getReadingHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const history = await ReadingHistory.find({ user: req.user._id })
      .populate({
        path: "post",
        select: "title slug thumbnail summary author publishTime category", // Lightweight projection
        populate: { path: "authorUser", select: "fullName avatar" },
      })
      .sort({ readAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ReadingHistory.countDocuments({ user: req.user._id });

    res.status(200).json({
      success: true,
      data: history,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate({
        path: "post",
        select:
          "title slug thumbnail summary author publishTime category status",
      })
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ success: true, count: bookmarks.length, data: bookmarks });
  } catch (error) {
    next(error);
  }
};

// --- LOGIC FOLLOW MỚI (UPDATE TRỰC TIẾP VÀO USER MODEL) ---
export const toggleFollow = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    if (currentUserId.toString() === targetUserId) {
      return next(errorHandler(400, "Bạn không thể tự theo dõi chính mình"));
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return next(errorHandler(404, "Người dùng không tồn tại"));

    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: targetUserId,
    });

    if (existingFollow) {
      // --- UNFOLLOW ---
      await Follow.findByIdAndDelete(existingFollow._id);

      // CẬP NHẬT CACHE COUNTER
      // Giảm following của mình -> -1
      await User.findByIdAndUpdate(currentUserId, {
        $inc: { followingCount: -1 },
      });
      // Giảm follower của họ -> -1
      await User.findByIdAndUpdate(targetUserId, {
        $inc: { followersCount: -1 },
      });

      return res.status(200).json({
        success: true,
        message: "Đã hủy theo dõi",
        isFollowing: false,
      });
    } else {
      // --- FOLLOW ---
      await Follow.create({
        follower: currentUserId,
        following: targetUserId,
      });

      // CẬP NHẬT CACHE COUNTER
      // Tăng following của mình -> +1
      await User.findByIdAndUpdate(currentUserId, {
        $inc: { followingCount: 1 },
      });
      // Tăng follower của họ -> +1
      await User.findByIdAndUpdate(targetUserId, {
        $inc: { followersCount: 1 },
      });

      return res
        .status(200)
        .json({ success: true, message: "Đã theo dõi", isFollowing: true });
    }
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 4. ADMIN FEATURES
// =========================================================================

export const getUsers = async (req, res, next) => {
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const sortDirection = req.query.sort === "asc" ? 1 : -1;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.searchTerm) {
      filter.$or = [
        { username: { $regex: req.query.searchTerm, $options: "i" } },
        { email: { $regex: req.query.searchTerm, $options: "i" } },
        { fullName: { $regex: req.query.searchTerm, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password -otpCode") // An toàn
      .sort({ createdAt: sortDirection })
      .skip(startIndex)
      .limit(limit);

    const totalUsers = await User.countDocuments(filter);

    res.status(200).json({
      users,
      totalUsers,
    });
  } catch (error) {
    next(error);
  }
};

export const switchBan = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isBanned, banReason, bannedUntil } = req.body;

    const user = await User.findById(userId);
    if (!user) return next(errorHandler(404, "User not found"));

    if (user.role === "admin") {
      return next(errorHandler(403, "Không thể ban Admin"));
    }

    user.isBanned = isBanned;

    if (isBanned) {
      user.banReason = banReason || "Vi phạm tiêu chuẩn cộng đồng";
      user.bannedUntil = bannedUntil ? new Date(bannedUntil) : null;
    } else {
      user.banReason = undefined;
      user.bannedUntil = undefined;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: isBanned
        ? `Đã khóa tài khoản ${user.username}`
        : `Đã mở khóa tài khoản ${user.username}`,
    });
  } catch (error) {
    next(error);
  }
};
