import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Post from "../models/post.model.js";

// Setup path to .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../../.env") });

const checkDB = async () => {
  try {
    console.log("🔍 Checking Database...");
    
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is undefined.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    // 1. Total Count
    const total = await Post.countDocuments({});
    console.log(`📊 Total Posts in DB: ${total}`);

    // 2. Filter Check: isDeleted
    const active = await Post.countDocuments({ isDeleted: false });
    console.log(`✅ Active Posts (isDeleted: false): ${active}`);

    // 3. Filter Check: status
    const published = await Post.countDocuments({ status: "published" });
    console.log(`📢 Published Posts: ${published}`);

    // 4. Combined Check (like Controller)
    const query = {
      isDeleted: false,
      status: "published",
      publishTime: { $lte: new Date() }
    };
    const visible = await Post.countDocuments(query);
    console.log(`👀 Visible to Public (Controller Query): ${visible}`);

    // 5. Inspect First Post
    if (total > 0) {
      const firstPost = await Post.findOne({});
      console.log("\n📄 First Post Data Snapshot:");
      console.log(JSON.stringify(firstPost, null, 2));
    }

  } catch (error) {
    console.error("❌ Check Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkDB();