import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Người nhận thông báo (VD: Tác giả bài viết, hoặc người được reply)
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index để load danh sách thông báo cực nhanh
    },

    // Người tạo ra hành động (VD: Người vừa bấm like)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Loại thông báo (Để Frontend hiện icon tương ứng: Tim, Comment, Follow...)
    type: {
      type: String,
      enum: [
        "like_post", // Ai đó like bài viết
        "comment_post", // Ai đó bình luận bài viết
        "reply_comment", // Ai đó trả lời bình luận
        "follow", // Ai đó follow bạn
        "system_alert", // Thông báo từ hệ thống (Admin gửi)
        "post_approved", // Bài viết được duyệt
        "post_rejected", // Bài viết bị từ chối
      ],
      required: true,
    },

    // Liên kết đến đối tượng (Bài viết ID, Comment ID, hoặc User ID)
    // Giúp khi bấm vào thông báo sẽ điều hướng đúng chỗ
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      // Không ref cứng vào đâu cả vì có thể là Post hoặc User tùy type
      required: true,
    },

    // Đường dẫn phụ (Optional) - VD: Slug bài viết để điều hướng trên App
    link: { type: String },

    // Trạng thái đọc
    isRead: {
      type: Boolean,
      default: false,
      index: true, // Để đếm số thông báo chưa đọc (Badge đỏ)
    },
  },
  { timestamps: true }
);

// Tự động populate sender (Avatar + Tên) để hiển thị ngay trên list thông báo
// notificationSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: "sender",
//     select: "fullName avatar",
//   });
//   next();
// });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
