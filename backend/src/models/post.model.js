// backend/models/post.model.js
import mongoose from "mongoose";

// Tối ưu hóa các trường trả về khi lấy danh sách để tiết kiệm băng thông
const LIGHTWEIGHT_PROJECTION =
  "title thumbnail category views likes publishTime readTime author source";

const postSchema = new mongoose.Schema(
  {
    // === THÔNG TIN CƠ BẢN ===
    source: {
      type: String,
      required: true,
      trim: true,
      index: true,
      default: "Internal",
    },
    sourceUrl: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // === PHÂN LOẠI ===
    category: {
      type: String,
      required: true,
      enum: [
        "news",
        "technology",
        "sports",
        "entertainment",
        "business",
        "health",
        "politics",
        "science",
        "other",
      ],
      index: true,
    },
    tags: [{ type: String, trim: true }],

    // === NỘI DUNG ===
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 300,
      index: "text", // Hỗ trợ tìm kiếm toàn văn
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    summary: { type: String, trim: true },
    content: { type: String, required: true },
    text: { type: String }, // Bản thô không có HTML
    thumbnail: { type: String },

    // === TÁC GIẢ ===
    author: {
      name: { type: String, default: "Unknown" },
      avatar: { type: String, default: "" },
    },
    authorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // === TƯƠNG TÁC (PHẦN TỐI ƯU LIKE) ===
    likes: {
      type: Number,
      default: 0,
      min: 0, // Đảm bảo số like không bao giờ âm
      index: true, // Thêm index để sort theo likes nhanh hơn
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true, // Tối ưu khi tìm "Bài viết đã thích bởi User X"
      },
    ],
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    comments: {
      type: Number,
      default: 0,
      min: 0,
    },

    // === TRẠNG THÁI & THỜI GIAN ===
    status: {
      type: String,
      enum: ["draft", "published", "archived", "deleted", "scheduled"],
      default: "published",
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishTime: { type: Date, default: Date.now, index: true },
    readTime: { type: Number, default: 1 }, // phút
    words: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index phức hợp để tối ưu việc lấy bài viết theo category và thời gian
postSchema.index({ category: 1, publishTime: -1 });

// === STATIC METHODS (Dùng cho Controller) ===

/**
 * Tối ưu hóa việc Toggle Like bằng Atomic Updates
 * Chống việc tăng 2 lần hoặc số âm
 */
postSchema.statics.toggleLike = async function (postId, userId) {
  const post = await this.findById(postId);
  if (!post) throw new Error("Post not found");

  const isLiked = post.likedBy.includes(userId);

  if (isLiked) {
    // Nếu đã like -> Bỏ like
    return this.findByIdAndUpdate(
      postId,
      {
        $pull: { likedBy: userId },
        $inc: { likes: -1 },
      },
      { new: true, runValidators: true }
    );
  } else {
    // Nếu chưa like -> Like
    return this.findByIdAndUpdate(
      postId,
      {
        $addToSet: { likedBy: userId }, // Chỉ thêm nếu chưa có (chống trùng)
        $inc: { likes: 1 },
      },
      { new: true, runValidators: true }
    );
  }
};

postSchema.statics.incrementViewsCount = async function (postId) {
  return this.findByIdAndUpdate(postId, { $inc: { views: 1 } });
};

// Tối ưu hóa việc lấy danh sách bài viết gọn nhẹ
postSchema.statics.getLightweightPosts = function (
  query = {},
  limit = 10,
  skip = 0
) {
  return this.find(query)
    .sort({ publishTime: -1 })
    .skip(skip)
    .limit(limit)
    .select(LIGHTWEIGHT_PROJECTION)
    .lean();
};

const Post = mongoose.model("Post", postSchema);
export default Post;
