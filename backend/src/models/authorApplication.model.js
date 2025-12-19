// models/AuthorApplication.js
import mongoose from "mongoose";

const authorApplicationSchema = new mongoose.Schema(
  {
    // Liên kết 1-1 chặt chẽ với User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Đảm bảo mỗi user chỉ có 1 đơn
      index: true,
    },

    // Trạng thái đơn
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    motivation: {
      type: String,
      required: true, // "Tại sao bạn muốn làm tác giả?"
      maxLength: 2000,
    },
    experience: {
      type: String,
      maxlength: 2000,
      description: "Writing experience and background",
    },

    documents: {
      identityCard: {
        front: { type: String, required: true }, // Ảnh mặt trước CCCD
        back: { type: String, required: true }, // Ảnh mặt sau CCCD
      },
      certificates: [
        {
          url: String,
          fileName: String,
          title: String,
          uploadedAt: Date,
        },
      ],
      portfolio: [
        {
          url: String,
          fileName: String,
          fileType: String,
          title: String,
          description: String,
          uploadedAt: Date,
        },
      ],
    },
    // Thông tin liên hệ thêm (nếu cần)
    phoneNumber: { type: String },
    externalLinks: {
      sampleArticles: [
        {
          url: String,
          title: String,
          description: String,
        },
      ],
      socialMedia: {
        twitter: String,
        linkedin: String,
        facebook: String,
        website: String,
        other: String,
      },
    },

    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String }, // Lý do từ chối (Gửi mail về cho User biết)
  },
  { timestamps: true, collection: "author_applications" }
);

const AuthorApplication = mongoose.model(
  "AuthorApplication",
  authorApplicationSchema
);
export default AuthorApplication;
