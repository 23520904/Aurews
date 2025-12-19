import Like from "../models/like.model.js";
import Post from "../models/post.model.js";
import { errorHandler } from "../utils/error.js";
import Comment from "../models/comment.model.js";
import dotenv from "dotenv";
// =========================================================================
// 1. CORE CRUD (CREATE, READ, UPDATE, DELETE)
// =========================================================================

// TẠO BÀI VIẾT (Author / Admin)
export const createPost = async (req, res, next) => {
  try {
    // Validate cơ bản
    if (!req.body.title || !req.body.text) {
      return next(
        errorHandler(400, "Vui lòng điền tiêu đề và nội dung bài viết")
      );
    }

    // 1. Xử lý Ảnh (Cloudinary)
    // req.file.path là link ảnh Cloudinary trả về từ middleware
    const thumbnail = req.file ? req.file.path : req.body.thumbnail;

    if (!thumbnail) {
      // Tùy chọn: Có thể set ảnh default nếu user không up
      // return next(errorHandler(400, "Vui lòng chọn ảnh bìa cho bài viết"));
    }

    // 2. Tạo Slug (Dùng thư viện slugify cho chuẩn SEO)
    let slug = slugify(req.body.title, { lower: true, strict: true });
    // Thêm random string để tránh trùng slug tuyệt đối
    slug += `-${Date.now().toString().slice(-4)}`;

    // 3. Xử lý Source URL
    // Ưu tiên lấy từ biến môi trường, nếu không có thì lấy dynamic host từ request
    // protocol: 'http' hoặc 'https'
    // host: 'localhost:6666' hoặc '192.168.1.5:6666'
    const protocol = req.protocol;
    const host = req.get("host");

    // Nếu CLIENT_URL trong .env chưa set, ta dùng chính IP của server API làm base
    const baseUrl = process.env.CLIENT_URL || `${protocol}://${host}`;
    const finalSourceUrl = `${baseUrl}/post/${slug}`;

    // 4. Xử lý Lịch đăng (Scheduling)
    // Nếu user chọn status 'scheduled' nhưng không gửi time -> Lỗi
    let publishTime = new Date();
    let status = "published";

    if (req.body.status === "scheduled" && req.body.publishTime) {
      status = "scheduled";
      publishTime = new Date(req.body.publishTime);
    } else if (req.body.status === "draft") {
      status = "draft";
    }

    // 5. Tạo Post
    const newPost = new Post({
      ...req.body,
      slug,
      thumbnail: thumbnail, // Link ảnh bìa
      text: req.body.text, // Nội dung HTML

      // Thông tin tác giả nội bộ
      authorUser: req.user._id,
      author: {
        name: req.user.fullName, // Fallback name
        avatar: req.user.avatar,
      },

      // Metadata bắt buộc
      source: "Internal",
      sourceUrl: finalSourceUrl,

      status: status,
      publishTime: publishTime,

      // Tính toán sơ bộ thời gian đọc (giả định 200 từ/phút)
      readTime: Math.ceil(req.body.text.length / 5 / 200) || 1,
    });

    const savedPost = await newPost.save();
    res.status(201).json({ success: true, data: savedPost });
  } catch (error) {
    // Handle lỗi trùng lặp (Duplicate Key)
    if (error.code === 11000) {
      return next(
        errorHandler(
          400,
          "Tiêu đề bài viết này đã tồn tại, vui lòng đổi tiêu đề khác."
        )
      );
    }
    next(error);
  }
};
// LẤY DANH SÁCH BÀI VIẾT (GET POSTS)
export const getPosts = async (req, res, next) => {
  try {
    const startIndex = parseInt(req.query.page)
      ? (parseInt(req.query.page) - 1) * parseInt(req.query.limit)
      : 0;
    const limit = parseInt(req.query.limit) || 10;
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

    // Quyền xem bài (Admin thấy hết, User chỉ thấy bài Published)
    if (!req.user || req.user.role !== "admin") {
      query.status = "published";
      query.publishTime = { $lte: new Date() }; // Chỉ hiện bài đã đến giờ đăng
    } else if (req.query.status) {
      query.status = req.query.status;
    }

    // PROJECTION: Loại bỏ trường nặng 'text' (Nội dung bài) để list load nhanh
    const posts = await Post.find(query)
      .populate("authorUser", "fullName avatar username")
      .sort({ publishTime: sortDirection })
      .skip(startIndex)
      .limit(limit)
      .select("-text -seo -location -videos"); // <--- TỐI ƯU HÓA

    const totalPosts = await Post.countDocuments(query);

    res.status(200).json({
      posts,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: parseInt(req.query.page) || 1,
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

    const post = await Post.findOne(query).populate("authorUser", "fullName avatar bio username");

    if (!post) return next(errorHandler(404, "Bài viết không tồn tại"));

    // Tăng View (Gọi hàm static trong Model)
    await Post.incrementViewsCount(post._id);

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};
// XÓA BÀI VIẾT (SOFT DELETE - CHUYỂN VÀO THÙNG RÁC)
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return next(errorHandler(404, "Post not found"));

    // Check quyền: Admin hoặc Chính chủ
    if (req.user.role !== "admin" && req.user._id.toString() !== post.authorUser?.toString()) {
      return next(errorHandler(403, "Bạn không có quyền xóa bài viết này"));
    }

    // SOFT DELETE Logic
    post.isDeleted = true;
    post.deletedAt = new Date();
    post.deletedBy = req.user._id;
    post.status = "deleted"; // Đổi status để không hiện ra nữa
    
    await post.save();

    res.status(200).json("Bài viết đã được chuyển vào thùng rác");
  } catch (error) {
    next(error);
  }
};

// KHÔI PHỤC BÀI VIẾT (RESTORE - Admin Only)
export const restorePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return next(errorHandler(404, "Post not found"));

        post.isDeleted = false;
        post.deletedAt = undefined;
        post.deletedBy = undefined;
        post.status = "draft"; // Khôi phục về nháp cho an toàn
        
        await post.save();
        res.status(200).json("Bài viết đã được khôi phục thành công");
    } catch (error) {
        next(error);
    }
};

// UPDATE POST
export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return next(errorHandler(404, "Post not found"));

    if (req.user.role !== "admin" && req.user._id.toString() !== post.authorUser?.toString()) {
      return next(errorHandler(403, "Bạn không có quyền chỉnh sửa"));
    }

    // Logic update ảnh: Lấy mới hoặc giữ cũ
    const newThumbnail = req.file ? req.file.path : (req.body.thumbnail || post.thumbnail);

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      {
        $set: {
          title: req.body.title,
          text: req.body.text || req.body.content,
          category: req.body.category,
          thumbnail: newThumbnail,
          summary: req.body.summary,
          status: req.body.status || post.status,
          // Có thể update thêm tags, seo...
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
      // Giảm count trong Post thủ công nếu hook Like không chạy (để chắc ăn)
      await Post.findByIdAndUpdate(postId, { $inc: { likes: -1 } });

      return res
        .status(200)
        .json({ success: true, message: "Unliked", isLiked: false });
    } else {
      // LIKE
      await Like.create({ user: userId, post: postId });
      // Tăng count trong Post
      await Post.findByIdAndUpdate(postId, { $inc: { likes: 1 } });

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
