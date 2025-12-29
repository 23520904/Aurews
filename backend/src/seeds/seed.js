import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import Post from "../models/post.model.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    // 1. Kết nối Database
    await mongoose.connect(
      "mongodb+srv://23520904_db_user:ojH56og0w84KYHxR@awrew.wrhzder.mongodb.net/aurews_db?appName=awrew"
    );
    console.log("🚀 Đã kết nối MongoDB...");

    // 2. Đọc file JSON bài viết
    const rawData = fs.readFileSync("./news_articles100 (1).json", "utf-8");
    const articles = JSON.parse(rawData);

    // ID Admin của bạn
    const ADMIN_ID = "6950356afbb0ab3dae424332";

    console.log("♻️ Đang chuẩn hóa dữ liệu bài viết...");

    // 3. Chuẩn hóa dữ liệu
    const postsToImport = articles.map((article) => {
      // XỬ LÝ LỖI AUTHOR:
      // Nếu article.author là object, lấy thuộc tính .name của nó
      // Nếu article.author đã là string thì giữ nguyên
      let authorName = "Unknown";
      if (article.author) {
        authorName =
          typeof article.author === "object"
            ? article.author.name || "Unknown"
            : article.author;
      }

      return {
        ...article,
        // Ép kiểu ID admin vào trường authorUser
        authorUser: new mongoose.Types.ObjectId(ADMIN_ID),

        // Gán tên tác giả dưới dạng String để khớp với Model
        author: authorName,

        // Đảm bảo content và text đồng bộ
        content: article.text || article.content || "Nội dung đang cập nhật...",
        text: article.text || article.content || "",

        // LOGIC LIKE MỚI (Tránh lỗi tăng ảo)
        likes: 0,
        likedBy: [],

        // Các chỉ số khác
        status: "published",
        views: Math.floor(Math.random() * 50),
        comments: 0,
      };
    });

    // 4. Thực hiện Insert (Xóa bài cũ trước khi nạp bài mới để tránh trùng SourceUrl)
    console.log("🗑️ Đang xóa bài viết cũ...");
    await Post.deleteMany({});

    console.log("📥 Đang nạp bài viết mới...");
    await Post.insertMany(postsToImport);

    console.log(`✅ Thành công: Đã nạp ${postsToImport.length} bài viết.`);
    console.log(
      `👤 Bài viết được gán cho Admin: admin@admin.com (ID: ${ADMIN_ID})`
    );

    process.exit();
  } catch (error) {
    console.error("❌ Lỗi khi seed dữ liệu:", error);
    process.exit(1);
  }
};

seedDatabase();
