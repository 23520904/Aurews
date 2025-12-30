import mongoose from "mongoose";
const userPreferencesSchema = new mongoose.Schema(
  {
    // Liên kết 1-1 với User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Các danh mục yêu thích
    favoriteCategories: [
      {
        type: String,
        enum: [
          "latest",
          "business news",
          "money & markets",
          "tech & innovation",
          "A.I",
          "life style",
          "politics",
        ],
      },
    ],
    theme: {
      type: String,
      enum: ["light", "dark"], // Có thể thêm 'system' nếu muốn theo hệ điều hành
      default: "light",
    },
    // Cài đặt thông báo
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: false,
    },
  },
  { collection: "user_preferences" }
);

const UserPreferences = mongoose.model(
  "UserPreferences",
  userPreferencesSchema
);
export default UserPreferences;
