// models/AuthorStats.js

import mongoose from "mongoose";

const authorStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true,
  },

  // Toàn bộ object 'authorStats' từ schema cũ
  totalPosts: { type: Number, default: 0 },
  publishedPosts: { type: Number, default: 0 },
  totalViews: { type: Number, default: 0 },
  totalLikes: { type: Number, default: 0 },
  followerCount: { type: Number, default: 0 },
});

export const AuthorStats = mongoose.model("AuthorStats", authorStatsSchema);
export default AuthorStats;
