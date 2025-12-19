import mongoose from "mongoose";
const bookmarkSchema = new mongoose.Schema(
  {
    // Người dùng đã lưu
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Bài viết được lưu
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Chỉ cần biết đã lưu khi nào
    collection: "bookmarks",
    // Đảm bảo user không thể lưu 1 bài 2 lần
    unique: ["user", "post"],
  }
);

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
export default Bookmark;
