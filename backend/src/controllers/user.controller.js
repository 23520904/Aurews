// backend/src/controllers/user.controller.js
import Notification from "../models/notification.model.js";
import Bookmark from "../models/bookmark.model.js";
import Like from "../models/like.model.js";
import Follow from "../models/follow.model.js";
import ReadingHistory from "../models/readingHistory.model.js";
import User from "../models/user.model.js";
import UserPreferences from "../models/userPreferences.model.js";
import Post from "../models/post.model.js"; // <--- Đảm bảo import này
import Comment from "../models/comment.model.js"; // <--- Đảm bảo import này
import { errorHandler } from "../utils/error.js";
import mongoose from "mongoose";

// =========================================================================
// 1. NOTIFICATIONS
// =========================================================================
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "fullName avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

export const markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res
      .status(200)
      .json({ success: true, message: "Đã đánh dấu tất cả là đã đọc" });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 2. QUẢN LÝ PROFILE (CÁ NHÂN)
// =========================================================================
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

export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, bio } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return next(errorHandler(404, "Không tìm thấy người dùng"));

    if (fullName) user.fullName = fullName;
    if (bio) user.bio = bio;
    if (req.file && req.file.path) {
      user.avatar = req.file.path;
    }

    const updatedUser = await user.save();
    const userObj = updatedUser.toObject();
    delete userObj.password;

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
// 3. QUẢN LÝ SỞ THÍCH
// =========================================================================
export const getUserPreferences = async (req, res, next) => {
  try {
    let prefs = await UserPreferences.findOne({ user: req.user._id });
    if (!prefs) {
      prefs = await UserPreferences.create({
        user: req.user._id,
        favoriteCategories: [],
        emailNotifications: true,
        pushNotifications: true,
        theme: "light", // <--- Thêm giá trị mặc định khi tạo mới
      });
    }
    res.status(200).json({ success: true, data: prefs });
  } catch (error) {
    next(error);
  }
};

export const updateUserPreferences = async (req, res, next) => {
  try {
    // 1. Lấy thêm 'theme' từ req.body
    const { favoriteCategories, emailNotifications, pushNotifications, theme } =
      req.body;

    // 2. Tạo object update động (chỉ cập nhật những trường có gửi lên)
    const updateData = {};
    if (favoriteCategories !== undefined)
      updateData.favoriteCategories = favoriteCategories;
    if (emailNotifications !== undefined)
      updateData.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined)
      updateData.pushNotifications = pushNotifications;
    if (theme !== undefined) updateData.theme = theme; // <--- Quan trọng nhất là dòng này

    const prefs = await UserPreferences.findOneAndUpdate(
      { user: req.user._id },
      { $set: updateData }, // Update object động
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
// 4. TƯƠNG TÁC
// =========================================================================
export const getReadingHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const history = await ReadingHistory.find({ user: req.user._id })
      .populate({
        path: "post",
        select: "title slug thumbnail summary author publishTime category",
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
        populate: { path: "authorUser", select: "fullName avatar" },
      })
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ success: true, count: bookmarks.length, data: bookmarks });
  } catch (error) {
    next(error);
  }
};

export const getLikedPosts = async (req, res, next) => {
  try {
    const likes = await Like.find({ user: req.user._id })
      .populate({
        path: "post",
        select:
          "title slug thumbnail summary author publishTime category status createdAt",
        populate: { path: "authorUser", select: "fullName avatar" },
      })
      .sort({ createdAt: -1 });

    const likedPosts = likes.map((like) => like.post).filter(Boolean);
    res
      .status(200)
      .json({ success: true, count: likedPosts.length, data: likedPosts });
  } catch (error) {
    next(error);
  }
};

// FOLLOW
export const getFollowers = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    const followers = await Follow.find({ following: userId })
      .populate("follower", "fullName username avatar bio")
      .sort({ createdAt: -1 });
    const users = followers.map((f) => f.follower);
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

export const getFollowing = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user._id;
    const following = await Follow.find({ follower: userId })
      .populate("following", "fullName username avatar bio")
      .sort({ createdAt: -1 });
    const users = following.map((f) => f.following);
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

export const getUserPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "-password -otpCode"
    );
    if (!user) return next(errorHandler(404, "Không tìm thấy người dùng"));

    let isFollowing = false;
    if (req.user) {
      const follow = await Follow.findOne({
        follower: req.user._id,
        following: user._id,
      });
      isFollowing = !!follow;
    }
    res
      .status(200)
      .json({ success: true, data: { ...user.toObject(), isFollowing } });
  } catch (error) {
    next(error);
  }
};

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
      await Follow.findByIdAndDelete(existingFollow._id);
      await User.findByIdAndUpdate(currentUserId, {
        $inc: { followingCount: -1 },
      });
      await User.findByIdAndUpdate(targetUserId, {
        $inc: { followersCount: -1 },
      });
      return res.status(200).json({ success: true, isFollowing: false });
    } else {
      await Follow.create({ follower: currentUserId, following: targetUserId });
      await User.findByIdAndUpdate(currentUserId, {
        $inc: { followingCount: 1 },
      });
      await User.findByIdAndUpdate(targetUserId, {
        $inc: { followersCount: 1 },
      });
      return res.status(200).json({ success: true, isFollowing: true });
    }
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req, res, next) => {
  try {
    const { searchTerm } = req.query;
    console.log("Called", searchTerm);
    if (!searchTerm) return res.status(200).json({ success: true, data: [] });

    const users = await User.find({
      $or: [
        { fullName: { $regex: searchTerm, $options: "i" } },
        { username: { $regex: searchTerm, $options: "i" } },
      ],
      isBanned: false,
    })
      .select("fullName username avatar role bio followersCount")
      .limit(20);
    console.log("Users duoc tim thay:", users);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 5. ADMIN FEATURES
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
      .select("-password -otpCode")
      .sort({ createdAt: sortDirection })
      .skip(startIndex)
      .limit(limit);

    const totalUsers = await User.countDocuments(filter);
    res.status(200).json({ users, totalUsers });
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
    if (user.role === "admin")
      return next(errorHandler(403, "Không thể ban Admin"));

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

export const getTopAuthors = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const authors = await User.find({
      role: { $in: ["author", "admin"] },
      isBanned: false,
    })
      .sort({ followersCount: -1 })
      .limit(limit)
      .populate("authorStats")
      .select("-password");
    res.status(200).json({ success: true, data: authors });
  } catch (error) {
    next(error);
  }
};

export const toggleBookmark = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return next(errorHandler(404, "Bài viết không tồn tại"));

    const existingBookmark = await Bookmark.findOne({
      user: userId,
      post: postId,
    });

    if (existingBookmark) {
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      return res.status(200).json({
        success: true,
        message: "Đã xóa khỏi danh sách lưu",
        isBookmarked: false,
      });
    } else {
      await Bookmark.create({ user: userId, post: postId });
      return res.status(200).json({
        success: true,
        message: "Đã lưu bài viết thành công",
        isBookmarked: true,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy thống kê tổng quan cho Admin Dashboard (FINAL VERSION)
 * @route   GET /api/users/analytics/growth
 * @access  Admin
 */
export const getAdminDashboardStats = async (req, res, next) => {
  try {
    console.log("--------- ADMIN DASHBOARD STATS (DEBUG) ---------");
    const days = 7;

    // 1. Setup ngày tháng (Fix cứng giờ để tránh lệch Timezone)
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // 2. Aggregate Data
    const growthAgg = await User.aggregate([
      {
        $match: { createdAt: { $gte: startDate, $lte: endDate } }, // Bỏ filter role để test
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log("📊 DB Data:", JSON.stringify(growthAgg));

    // 3. Gap Filling (Logic mới an toàn hơn)
    const chartData = [];

    // Chuyển mảng DB thành Map để tra cứu
    const dateMap = new Map();
    growthAgg.forEach((item) => {
      dateMap.set(item._id, item.count);
    });

    // Vòng lặp tạo 7 ngày
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      // Quan trọng: Format ngày giống hệt Mongo ($dateToString format "%Y-%m-%d")
      // Dùng hàm này để đảm bảo không bị lệch giờ UTC/Local
      const dateStr = d.toISOString().split("T")[0];

      const val = dateMap.get(dateStr) || 0;
      const label = `${d.getDate()}/${d.getMonth() + 1}`;

      // LOG KIỂM TRA TỪNG NGÀY
      if (val > 0) console.log(`✅ Match found: ${dateStr} = ${val}`);

      chartData.push({
        value: val,
        label: label,
        dataPointText: val.toString(),
        dataPointColor: "#b91c1c",
        textColor: "#6b7280",
      });
    }

    // 4. Stats Overview
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments({
      isDeleted: false,
      status: "published",
    });
    const totalComments = await Comment.countDocuments({ isDeleted: false });
    const likesAgg = await Post.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, totalLikes: { $sum: "$likes" } } },
    ]);
    const totalLikes = likesAgg.length > 0 ? likesAgg[0].totalLikes : 0;

    console.log(
      "📈 Final Chart Data:",
      JSON.stringify(chartData.map((c) => ({ d: c.label, v: c.value })))
    );

    res.status(200).json({
      success: true,
      data: {
        chartData,
        stats: { totalUsers, totalPosts, totalComments, totalLikes },
      },
    });
  } catch (error) {
    console.error("❌ Error:", error);
    next(error);
  }
};

export const getAuthorStats = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // 1. TÍNH TỔNG SỐ LIỆU (Views, Likes, Comments, Posts)
    // Chúng ta dùng Aggregation trên bảng Post để cộng dồn các trường views, likes, comments
    const statsAggregation = await Post.aggregate([
      {
        $match: {
          authorUser: new mongoose.Types.ObjectId(currentUserId), // Quan trọng: Chỉ lấy bài của user này
          isDeleted: false,
          status: "published", // Chỉ tính bài đã xuất bản
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" }, // Tổng lượt xem
          totalLikes: { $sum: "$likes" }, // Tổng lượt tim bài viết
          totalComments: { $sum: "$comments" }, // Tổng lượt bình luận
          totalPosts: { $sum: 1 }, // Đếm số lượng bài
        },
      },
    ]);

    // Nếu chưa có bài viết nào thì trả về 0
    const stats = statsAggregation[0] || {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalPosts: 0,
    };
    console.log(stats);
    // 2. BIỂU ĐỒ TẦN SUẤT NGƯỜI XEM (Growth Analytics) - 7 ngày gần nhất
    // Sử dụng bảng ReadingHistory để biết chính xác lượt đọc xảy ra vào ngày nào
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Bước A: Lấy danh sách ID bài viết của tác giả để lọc trong lịch sử đọc
    const myPosts = await Post.find({ authorUser: currentUserId }).select(
      "_id"
    );
    const myPostIds = myPosts.map((p) => p._id);

    const growthData = await ReadingHistory.aggregate([
      {
        $match: {
          post: { $in: myPostIds }, // Chỉ tính lượt đọc thuộc bài viết của tôi
          readAt: { $gte: sevenDaysAgo }, // Lấy dữ liệu từ 7 ngày trước
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$readAt" }, // Gom nhóm theo ngày
          },
          views: { $sum: 1 }, // Đếm số lượt đọc trong ngày đó
        },
      },
      { $sort: { _id: 1 } }, // Sắp xếp ngày tăng dần
    ]);

    // Format dữ liệu để thư viện biểu đồ ở Frontend dễ đọc (label, value)
    const chartData = growthData.map((item) => ({
      label: item._id.split("-").slice(1).join("/"), // Chuyển "2023-10-25" thành "10/25"
      value: item.views,
    }));
    console.log(chartData);
    // Lấy thêm số follower hiện tại
    const author = await User.findById(currentUserId).select("followersCount");

    res.status(200).json({
      success: true,
      data: {
        stats: {
          ...stats,
          followerCount: author?.followersCount || 0,
        },
        chartData,
      },
    });
    console.log(res.data);
  } catch (error) {
    next(error);
  }
};
