import Like from "../models/like.model.js";
import Post from "../models/post.model.js";
import ReadingHistory from "../models/readingHistory.model.js";
import { errorHandler } from "../utils/error.js";
import slugify from "slugify"; // <--- QUAN TRỌNG: Nhớ import cái này
// =========================================================================
// 1. CORE CRUD (CREATE, READ, UPDATE, DELETE)
// =========================================================================

// TẠO BÀI VIẾT (Author / Admin)
export const createPost = async (req, res, next) => {
  try {
    if (!req.body.title) {
      return next(errorHandler(400, "Vui lòng điền tiêu đề bài viết"));
    }

    // 1. Xử lý Ảnh (Cloudinary)
    let thumbnail = "";
    if (req.file) {
      thumbnail = req.file.path;
    } else if (req.body.thumbnailUrl) {
      thumbnail = req.body.thumbnailUrl;
    } else {
      thumbnail = req.body.thumbnail;
    }

    // 2. Tạo Slug
    let slug = slugify(req.body.title, {
      lower: true,
      strict: true,
      locale: "vi",
    });
    slug += `-${Date.now().toString().slice(-4)}`;

    // 3. Source URL
    const protocol = req.protocol;
    const host = req.get("host");
    const baseUrl = process.env.CLIENT_URL || `${protocol}://${host}`;
    const finalSourceUrl = `${baseUrl}/post/${slug}`;

    // 4. Status & Time
    let publishTime = new Date();
    let status = "published";
    if (req.body.status === "scheduled" && req.body.publishTime) {
      status = "scheduled";
      publishTime = new Date(req.body.publishTime);
    } else if (req.body.status) {
      status = req.body.status;
    }

    // Nội dung bài viết (HTML từ editor)
    const postContent = req.body.text || "";

    // 5. Tạo Post
    const newPost = new Post({
      ...req.body,
      slug,
      thumbnail: thumbnail || "https://placehold.co/600x400?text=No+Image",

      // --- FIX LỖI TẠI ĐÂY ---
      // Model yêu cầu 'content', Frontend gửi 'text'
      // Ta gán giá trị vào cả 2 để chắc chắn không bị lỗi validation
      text: postContent,
      content: postContent, // <--- DÒNG QUAN TRỌNG ĐỂ FIX LỖI

      authorUser: req.user._id,
      author: {
        name: req.user.fullName,
        avatar: req.user.avatar,
      },

      source: "Internal",
      sourceUrl: finalSourceUrl,
      status: status,
      publishTime: publishTime,
      readTime: postContent ? Math.ceil(postContent.length / 5 / 200) || 1 : 1,
    });

    const savedPost = await newPost.save();
    res.status(201).json({ success: true, data: savedPost });
  } catch (error) {
    if (error.code === 11000) {
      return next(errorHandler(400, "Tiêu đề bài viết này đã tồn tại."));
    }
    console.log("Create Post Error:", error);
    next(error);
  }
};
// LẤY DANH SÁCH BÀI VIẾT (GET POSTS)
export const getPosts = async (req, res, next) => {
  try {
    // 1. Parse Limit & Page an toàn
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const startIndex = (page - 1) * limit;

    const sortDirection = req.query.order === "asc" ? 1 : -1;

    const query = { isDeleted: false }; // Chỉ lấy bài chưa xóa

    // Filter
    if (req.query.userId) query.authorUser = req.query.userId;
    if (req.query.category && req.query.category !== "undefined")
      query.category = req.query.category;
    if (req.query.slug) query.slug = req.query.slug;

    // Search
    if (req.query.searchTerm) {
      query.$text = { $search: req.query.searchTerm }; // Dùng Text Index (Hiệu năng cao hơn Regex)
    }

    // Authorization: Admin sees all; Authors can view their own posts; others see only published posts
    if (req.user && (req.user.role === "author" || req.user.role === "admin")) {
      // Admin can filter by status
      if (req.user.role === "admin" && req.query.status) {
        query.status = req.query.status;
      } else if (
        req.query.userId &&
        req.user._id &&
        req.query.userId !== req.user._id.toString()
      ) {
        // Author requesting posts of others -> restrict to published
        query.status = "published";
        query.publishTime = { $lte: new Date() };
      }
      // else: author requesting own posts -> no extra filter (allow drafts/scheduled)
    } else {
      // Not logged in or regular reader
      query.status = "published";
      query.publishTime = { $lte: new Date() };
    }

    // PROJECTION: Loại bỏ trường nặng 'text' (Nội dung bài) để list load nhanh
    const posts = await Post.find(query)
      .populate("authorUser", "fullName avatar username")
      .sort({ publishTime: sortDirection })
      .skip(startIndex)
      .limit(limit)
      .select("-text -seo -location -videos"); // <--- TỐI ƯU HÓA

    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      success: true,
      posts,
      totalPosts,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      nextPage: page < totalPages ? page + 1 : null,
    });
  } catch (error) {
    next(error);
  }
};

// LẤY CHI TIẾT 1 BÀI VIẾT
export const getPostDetail = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Tìm bài viết (Slug hoặc ID)
    const isId = slug.match(/^[0-9a-fA-F]{24}$/);
    const query = isId ? { _id: slug } : { slug: slug };
    query.isDeleted = false;

    const post = await Post.findOne(query).populate(
      "authorUser",
      "fullName avatar bio username"
    );

    if (!post) return next(errorHandler(404, "Bài viết không tồn tại"));

    // Tăng View (Gọi hàm static trong Model)
    await Post.incrementViewsCount(post._id);

    // Lưu lịch sử đọc nếu user đã đăng nhập
    if (req.user) {
      await ReadingHistory.findOneAndUpdate(
        { user: req.user._id, post: post._id },
        { readAt: new Date() },
        { upsert: true, new: true }
      );
    }

    // Kiểm tra User đã like bài viết chưa (nếu đã đăng nhập)
    let isLiked = false;
    if (req.user) {
      const likeExist = await Like.exists({
        user: req.user._id,
        post: post._id,
      });
      isLiked = !!likeExist;
    }

    // Convert sang Object thường để gắn thêm field isLiked
    const postData = post.toObject();
    postData.isLiked = isLiked;

    res.status(200).json({ success: true, data: postData });
  } catch (error) {
    next(error);
  }
};

// LẤY BÀI VIẾT CỦA AUTHOR HIỆN TẠI
export const getAuthorPosts = async (req, res, next) => {
  try {
    const query = { authorUser: req.user._id, isDeleted: false };
    const posts = await Post.find(query)
      .sort({ publishTime: -1 })
      .select("-text -seo -location -videos")
      .populate("authorUser", "fullName avatar username");
    return res.status(200).json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

// XÓA BÀI VIẾT (SOFT DELETE - CHUYỂN VÀO THÙNG RÁC)
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return next(errorHandler(404, "Bài viết không tồn tại"));
    }

    // Kiểm tra quyền: Chỉ Admin hoặc chính Tác giả mới được xóa
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== post.authorUser.toString()
    ) {
      return next(errorHandler(403, "Bạn không có quyền xóa bài viết này"));
    }

    // SOFT DELETE: Chỉ đánh dấu là đã xóa, không xóa khỏi DB
    post.isDeleted = true;
    post.status = "deleted"; // Cập nhật luôn status cho đồng bộ
    await post.save();

    res
      .status(200)
      .json({ success: true, message: "Đã xóa bài viết thành công" });
  } catch (error) {
    next(error);
  }
};

// KHÔI PHỤC BÀI VIẾT (RESTORE - Admin Only)
export const restorePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return next(errorHandler(404, "Bài viết không tồn tại"));
    }

    // --- QUYỀN HẠN: Admin HOẶC Chính tác giả ---
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== post.authorUser.toString()
    ) {
      return next(
        errorHandler(403, "Bạn không có quyền khôi phục bài viết này")
      );
    }

    // Logic khôi phục
    post.isDeleted = false;
    post.status = "draft"; // Khôi phục về nháp để tác giả kiểm tra lại trước khi đăng

    await post.save();

    res
      .status(200)
      .json({ success: true, message: "Đã khôi phục bài viết về mục Nháp" });
  } catch (error) {
    next(error);
  }
};

// UPDATE POST
export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return next(errorHandler(404, "Post not found"));

    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== post.authorUser?.toString()
    ) {
      return next(errorHandler(403, "Bạn không có quyền chỉnh sửa"));
    }

    const newThumbnail = req.file
      ? req.file.path
      : req.body.thumbnail || post.thumbnail;

    const newContent = req.body.text || req.body.content;

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      {
        $set: {
          title: req.body.title,
          category: req.body.category,
          thumbnail: newThumbnail,
          summary: req.body.summary,
          status: req.body.status || post.status,

          // --- FIX LỖI TẠI ĐÂY ---
          // Cập nhật cả 2 trường khi sửa bài
          text: newContent,
          content: newContent,
        },
      },
      { new: true }
    );
    res.status(200).json(updatedPost);
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 2. SOCIAL FEATURES (LIKE & COMMENT)
// =========================================================================

// LIKE / UNLIKE POST
export const toggleLike = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return next(errorHandler(404, "Post not found"));

    const existingLike = await Like.findOne({ user: userId, post: postId });

    if (existingLike) {
      // UNLIKE
      await Like.findByIdAndDelete(existingLike._id);

      // Sync count: Recalculate exactly from DB to prevent drift
      const count = await Like.countDocuments({ post: postId });
      await Post.findByIdAndUpdate(postId, { likes: count });

      return res
        .status(200)
        .json({ success: true, message: "Unliked", isLiked: false });
    } else {
      // LIKE
      await Like.create({ user: userId, post: postId });

      // Sync count: Recalculate exactly from DB to prevent drift
      const count = await Like.countDocuments({ post: postId });
      await Post.findByIdAndUpdate(postId, { likes: count });

      return res
        .status(200)
        .json({ success: true, message: "Liked", isLiked: true });
    }
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// 3. ADMIN ONLY FEATURES
// =========================================================================

// DUYỆT BÀI / ĐỔI TRẠNG THÁI
export const adminUpdateStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'published', 'draft', 'archived'
    const { postId } = req.params;

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $set: { status: status } },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (error) {
    next(error);
  }
};

export const getMyPosts = async (req, res, next) => {
  try {
    // 1. Lấy tham số phân trang
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit; // Tính số bài cần bỏ qua

    const { searchTerm, status } = req.query;

    let query = { authorUser: req.user._id };

    // Logic lọc status (như cũ)
    if (status === "archived") {
      query.$or = [{ isDeleted: true }, { status: "archived" }];
    } else {
      query.isDeleted = { $ne: true };
      if (status && status !== "ALL" && status !== "undefined") {
        query.status = status;
      }
    }

    // Logic tìm kiếm (như cũ)
    if (searchTerm) {
      query.title = { $regex: searchTerm, $options: "i" };
    }

    // 2. Query Database với Skip và Limit
    const posts = await Post.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip) // <--- QUAN TRỌNG: Bỏ qua bài của trang trước
      .limit(limit) // Chỉ lấy số lượng limit
      .select("-text")
      .populate("authorUser", "fullName avatar");

    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);

    // 3. Trả về thêm thông tin phân trang (pagination info)
    res.status(200).json({
      success: true,
      posts,
      totalPosts,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    next(error);
  }
};
