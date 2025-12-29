// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema(
{
    // === THÔNG TIN CƠ BẢN ===
    email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true,
    },
    dateOfBirth: {
    type: Date,
    required: true, // Bắt buộc nhập
    },
    fullName: { type: String, required: true, trim: true },
    avatar: { type: String, default: "https://avatar.iran.liara.run/public" },
    bio: { type: String, maxlength: 500, default: "" },

    // Hỗ trợ đăng nhập Google/Facebook sau này
    provider: {
    type: String,
    default: "local",
    enum: ["local", "google", "facebook"],
    },
    providerId: { type: String }, // ID của Google/FB trả về

    // Quên mật khẩu & Xác thực Email
    otpCode: { type: String, select: false }, // Mã OTP 6 số
    otpExpires: { type: Date, select: false }, // Thời gian hết hạn OTP
    isEmailVerified: { type: Boolean, default: false },
    // === VAI TRÒ & TRẠNG THÁI ===
    role: {
    type: String,
    enum: ["reader", "author", "admin"], //
    default: "reader",
    index: true,
    },
    isVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    bannedUntil: Date,
    banReason: String,
    lastLogin: Date,
    // === LIÊN KẾT 1-1 (TỐI ƯU HÓA) ===
    // Liên kết đến đơn ứng tuyển (nếu có)
    authorApplication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AuthorApplication",
    },
    // Liên kết đến thống kê tác giả (nếu là author)
    authorStats: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AuthorStats",
    },
    // Lưu thẳng số lượng vào đây để khi load Profile không cần đếm lại từ bảng Follow
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
},
{ timestamps: true }
);

// Hash password trước khi lưu
userSchema.pre("save", async function () {
if (!this.isModified("password")) {
    return;
}
const salt = await bcrypt.genSalt(10);
this.password = await bcrypt.hash(this.password, salt);
});

// So sánh password
userSchema.methods.comparePassword = async function (candidatePassword) {
return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
