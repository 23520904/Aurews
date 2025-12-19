import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    // Người báo cáo
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Đối tượng bị báo cáo (Đa hình: Có thể là Post, Comment hoặc User)
    targetType: {
      type: String,
      enum: ["Post", "Comment", "User"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType", // Mongoose tự động ref tới model tương ứng
    },

    // Lý do báo cáo
    reason: {
      type: String,
      required: true,
      trim: true, // VD: "Spam", "Ngôn từ thù ghét", "Lừa đảo"
    },

    // Trạng thái xử lý
    status: {
      type: String,
      enum: ["pending", "resolved", "rejected"],
      default: "pending",
      index: true, // Index để Admin lọc các report chưa xử lý
    },

    // Admin ghi chú lại cách giải quyết (VD: "Đã xóa bài", "Đã ban user")
    adminNote: { type: String },

    // Admin nào đã xử lý?
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;
