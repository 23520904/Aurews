import mongoose from "mongoose";
import Post from "./post.model.js";
const likeSchema = new mongoose.Schema(
  {
    // Người dùng đã nhấn "thích"
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Bài viết được "thích"
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true, // Chỉ cần biết đã thích khi nào
    collection: "likes",
    // Đảm bảo user không thể "thích" 1 bài 2 lần
    unique: ["user", "post"],
  }
);

// HOOKS REMOVED: Logic moved to controller for better control and to prevent double-counting.
// The controller now recalculates the count using countDocuments() which is self-healing.

/*
likeSchema.post("save", async function (doc) {
  try {
    // Tăng bộ đếm "likes" trên model Post
    await Post.findByIdAndUpdate(doc.post, { $inc: { likes: 1 } });
  } catch (error) {
    console.error("Error in increase like counter:", error);
  }
});

likeSchema.post("remove", async function (doc) {
  try {
    // Chỉ giảm lượt like nếu số lượng hiện tại > 0 để tránh số âm
    await Post.findOneAndUpdate(
      { _id: doc.post, likes: { $gt: 0 } },
      { $inc: { likes: -1 } }
    );
  } catch (error) {
    console.error("Lỗi khi giảm bộ đếm like:", error);
  }
});
*/

const Like = mongoose.model("Like", likeSchema);
export default Like;
