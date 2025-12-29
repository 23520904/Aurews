import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

// Setup path to .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../../.env") });

const sampleImages = [
  "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b",
  "https://images.unsplash.com/photo-1531297461136-8200b2a0a71b",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
  "https://images.unsplash.com/photo-1518770660439-4636190af475",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
  "https://images.unsplash.com/photo-1504384308090-c54be3855833",
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
];

const categories = [
  "technology",
  "business",
  "health",
  "science",
  "entertainment",
  "sports",
];

const seedPosts = async () => {
  try {
    console.log("🌱 Starting seed process...");

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is undefined. Check .env path.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    // Find a user to assign as author
    const user = await User.findOne();
    if (!user) {
      console.error(
        "❌ No users found! Please register a user first via the app or API."
      );
      process.exit(1);
    }
    console.log(`👤 Using author: ${user.fullName} (${user._id})`);

    // Clear old posts first
    await Post.deleteMany({});
    console.log("🗑️ Cleared existing posts");

    // Create 20 dummy posts
    const posts = Array.from({ length: 20 }).map((_, index) => {
      const title = `Amazing Article #${index + 1} - The Future of ${
        categories[index % categories.length]
      }`;
      const slug = `amazing-article-${index + 1}-${Date.now()}`;

      return {
        title,
        slug,
        summary:
          "This is a brief summary of the article to catch the reader's attention.",
        content: `
          <h2>Introduction</h2>
          <p>This is a sample article content generated for testing purposes. It contains <strong>HTML</strong> formatting.</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          <h3>Key Takeaways</h3>
          <ul>
            <li>Point one is very important.</li>
            <li>Point two is equally crucial.</li>
            <li>Always remember point three.</li>
          </ul>
        `,
        text: `
          <h2>Introduction</h2>
          <p>This is a sample article content generated for testing purposes. It contains <strong>HTML</strong> formatting.</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          <h3>Key Takeaways</h3>
          <ul>
            <li>Point one is very important.</li>
            <li>Point two is equally crucial.</li>
            <li>Always remember point three.</li>
          </ul>
        `,
        thumbnail: sampleImages[index % sampleImages.length],
        category: categories[index % categories.length],
        status: "published",
        publishTime: new Date(Date.now() - index * 86400000), // Backdated by 1 day each
        authorUser: user._id,
        author: {
          name: user.fullName,
          avatar: user.avatar,
        },
        source: "Internal",
        sourceUrl: `http://localhost:3000/post/${slug}`,
        readTime: Math.floor(Math.random() * 10) + 2,
        views: Math.floor(Math.random() * 1000),
        likes: Math.floor(Math.random() * 500),
      };
    });

    await Post.insertMany(posts);
    console.log(`✅ Successfully inserted ${posts.length} posts!`);
  } catch (error) {
    console.error("❌ Seed Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedPosts();
