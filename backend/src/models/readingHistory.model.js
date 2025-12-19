import mongoose from "mongoose";
const readingHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    collection: "reading_history",
    index: ["user", "post"],
    
  }
);

const ReadingHistory = mongoose.model("ReadingHistory", readingHistorySchema);
export default ReadingHistory;