import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import bcrypt from "bcryptjs";

dotenv.config();

const SAMPLE_USERS = [
  {
    fullName: "Nguyễn Văn A",
    username: "nguyenvana",
    email: "user1@example.com",
    avatar: "https://avatar.iran.liara.run/public/1",
    dateOfBirth: new Date("1990-01-01"),
  },
  {
    fullName: "Trần Thị B",
    username: "tranthib",
    email: "user2@example.com",
    avatar: "https://avatar.iran.liara.run/public/2",
    dateOfBirth: new Date("1992-05-15"),
  },
  {
    fullName: "Lê Văn C",
    username: "levanc",
    email: "user3@example.com",
    avatar: "https://avatar.iran.liara.run/public/3",
    dateOfBirth: new Date("1995-10-20"),
  },
  {
    fullName: "Phạm Thị D",
    username: "phamthid",
    email: "user4@example.com",
    avatar: "https://avatar.iran.liara.run/public/4",
    dateOfBirth: new Date("1998-03-08"),
  },
  {
    fullName: "Hoàng Văn E",
    username: "hoangvane",
    email: "user5@example.com",
    avatar: "https://avatar.iran.liara.run/public/5",
    dateOfBirth: new Date("2000-12-25"),
  },
];

const SAMPLE_COMMENTS = [
  "Bài viết rất hay và bổ ích!",
  "Cảm ơn tác giả đã chia sẻ.",
  "Tôi hoàn toàn đồng ý với quan điểm này.",
  "Thông tin này có chính xác không nhỉ?",
  "Hóng bài viết tiếp theo của bạn.",
  "Tuyệt vời!",
  "Không thể tin được.",
  "Có ai giải thích rõ hơn đoạn này giúp mình không?",
  "Quá chuẩn luôn.",
  "Mình thấy chưa thuyết phục lắm.",
];

const seedComments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚀 Connected to MongoDB...");

    // 1. Create Users
    console.log("Creating users...");
    const createdUsers = [];
    for (const u of SAMPLE_USERS) {
      const existingUser = await User.findOne({ email: u.email });
      if (existingUser) {
        createdUsers.push(existingUser);
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("123456", salt);
        const newUser = await User.create({
          ...u,
          password: hashedPassword,
          role: "reader",
          isVerified: true,
        });
        createdUsers.push(newUser);
      }
    }
    console.log(`✅ ${createdUsers.length} users ready.`);

    // 2. Get Posts
    const posts = await Post.find({}).limit(20); // Seed for first 20 posts
    if (posts.length === 0) {
      console.log("❌ No posts found. Run seedPosts.js first.");
      process.exit(1);
    }

    // 3. Create Comments
    console.log("Creating comments...");
    await Comment.deleteMany({}); // Clear old comments
    // Reset comment counts on posts
    await Post.updateMany({}, { comments: 0 });

    for (const post of posts) {
      const numComments = Math.floor(Math.random() * 5) + 1; // 1-5 comments per post

      for (let i = 0; i < numComments; i++) {
        const user =
          createdUsers[Math.floor(Math.random() * createdUsers.length)];
        const text =
          SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)];

        const comment = new Comment({
          post: post._id,
          user: user._id,
          text: text,
          likes: Math.floor(Math.random() * 10),
        });
        await comment.save(); // Model hook will update Post.comments count

        // 30% chance to have replies
        if (Math.random() > 0.7) {
          const numReplies = Math.floor(Math.random() * 3) + 1;
          for (let j = 0; j < numReplies; j++) {
            const replyUser =
              createdUsers[Math.floor(Math.random() * createdUsers.length)];
            const replyText =
              SAMPLE_COMMENTS[
                Math.floor(Math.random() * SAMPLE_COMMENTS.length)
              ];

            const reply = new Comment({
              post: post._id,
              user: replyUser._id,
              text: replyText,
              parentComment: comment._id,
              likes: Math.floor(Math.random() * 5),
            });
            await reply.save();
          }
        }
      }
    }

    console.log("✅ Seed comments successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding comments:", error);
    process.exit(1);
  }
};

seedComments();
