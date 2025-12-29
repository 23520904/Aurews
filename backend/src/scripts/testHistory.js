import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import ReadingHistory from "../models/readingHistory.model.js";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";

// Setup path to .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../../.env") });

const testReadingHistory = async () => {
  try {
    console.log("🔍 Testing Reading History Logic...");
    
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is undefined.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    // 1. Get a test user
    const user = await User.findOne({});
    if (!user) throw new Error("No users found");
    console.log(`👤 Using User: ${user.fullName} (${user._id})`);

    // 2. Get a test post
    const post = await Post.findOne({});
    if (!post) throw new Error("No posts found");
    console.log(`📝 Using Post: ${post.title} (${post._id})`);

    // 3. Simulate View (Directly calling DB logic similar to Controller)
    console.log("⏳ Simulating Post View...");
    const history = await ReadingHistory.findOneAndUpdate(
      { user: user._id, post: post._id },
      { readAt: new Date() },
      { upsert: true, new: true }
    );

    console.log("✅ Reading History Saved/Updated:");
    console.log(JSON.stringify(history, null, 2));

    // 4. Verify Count
    const count = await ReadingHistory.countDocuments({ user: user._id });
    console.log(`📊 Total History Records for User: ${count}`);

  } catch (error) {
    console.error("❌ Test Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testReadingHistory();