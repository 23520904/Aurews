import mongoose from "mongoose";
const followSchema = new mongoose.Schema(
  {
    // Người đi theo dõi
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Người được theo dõi (phải là author/admin)
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "follows",
    // Không thể theo dõi 1 người 2 lần
    unique: ["follower", "following"],
  }
);

const Follow = mongoose.model("Follow", followSchema);
export default Follow;
