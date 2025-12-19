import mongoose from "mongoose";
import Post from "./post.model.js";
const commentSchema = new mongoose.Schema(
  {
    // Bài viết được bình luận
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    // Người bình luận
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Nội dung
    text: {
      type: String,
      required: true,
      trim: true,
      maxLength: 1000,
    },

    // Dành cho trả lời (Reply): 'parentComment' trỏ đến bình luận gốc
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true, // Index để query các reply của 1 comment
    },
    likes: {
      type: Number,
      default: 0,
    },
    // Mảng chứa ID user đã like (để check xem user hiện tại đã like chưa)
    // Lưu ý: Nếu lượng like quá lớn (>10k), nên tách ra bảng Like riêng.
    // Với quy mô vừa phải, lưu mảng ObjectId ở đây là OK và nhanh nhất.
    likesBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Dùng cho Xóa Mềm (Soft Delete)
    isEdited: { type: Boolean, default: false }, // Đã chỉnh sửa chưa?
    isDeleted: { type: Boolean, default: false }, // Soft delete cho comment
    deletedAt: { type: Date },
  },
  { timestamps: true, collection: "comments" }
);
// Tự động populate thông tin user khi query comment (Tiện lợi cho Frontend)
// Lưu ý: Chỉ lấy fullName và avatar để nhẹ JSON
commentSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "fullName avatar",
  });
  next();
});
commentSchema.post("save", async function (doc) {
  try {
    // Tăng bộ đếm "comments" trên model Post
    if (this._wasNew) {
      // Tăng bộ đếm "comments" trên model Post
      await Post.findByIdAndUpdate(doc.post, { $inc: { comments: 1 } });
    }
  } catch (error) {
    console.error("Error in increase comment counter:", error);
  }
});
commentSchema.post("remove", async function (doc) {
  try {
    // Giảm bộ đếm "comments" trên model Post
    await Post.findByIdAndUpdate(doc.post, { $inc: { comments: -1 } });

    // (Nâng cao): Xóa tất cả các bình luận con (replies)
    if (!doc.parentComment) {
      await mongoose.model("Comment").deleteMany({ parentComment: doc._id });
    }
  } catch (error) {
    console.error("Error in decrease comment counter:", error);
  }
});
const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
