import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// 1. Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Hàm tạo Storage (Factory Function)
const createCloudinaryStorage = (
  folderPath,
  allowedFormats = ["jpg", "png", "jpeg", "webp"]
) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `aurews_app/${folderPath}`,
      allowed_formats: allowedFormats,
      resource_type: "auto",
      public_id: (req, file) => {
        const name = file.originalname.split(".")[0];
        return `${name}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
      },
    },
  });
};

// --- CÁC UPLOADER RIÊNG BIỆT ---

// A. Upload Avatar (Profile)
const avatarStorage = createCloudinaryStorage("users/avatars");
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("avatar");

// B. Upload Ảnh Bìa Bài Viết (Thumbnail/Feature Image) -> DÙNG CHO POST CONTROLLER
// Logic: Upload 1 ảnh duy nhất, field name là "image"
const postImageStorage = createCloudinaryStorage("posts/thumbnails");
export const postImageUpload = multer({
  storage: postImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single("image");

// C. Upload Gallery Bài viết (Nhiều ảnh/video trong nội dung) -> DÙNG CHO EDITOR
const postMediaStorage = createCloudinaryStorage("posts/media", [
  "jpg",
  "png",
  "jpeg",
  "webp",
  "mp4",
  "mov",
]);
export const uploadPostMedia = multer({
  storage: postMediaStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB cho video
}).array("images", 10); // Cho phép up 1 lúc 10 file

// D. Upload Hồ sơ tác giả (Logic phức tạp riêng)
const authorAppStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = "aurews_app/authors/others";
    if (file.fieldname === "identityCard")
      folder = "aurews_app/authors/identity";
    else if (file.fieldname === "certificates")
      folder = "aurews_app/authors/certificates";
    else if (file.fieldname === "portfolio")
      folder = "aurews_app/authors/portfolio";

    return {
      folder: folder,
      resource_type: "auto",
      public_id: `${file.fieldname}-${Date.now()}`,
    };
  },
});

export const authorApplicationUpload = multer({
  storage: authorAppStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: "identityCard", maxCount: 2 },
  { name: "certificates", maxCount: 5 },
  { name: "portfolio", maxCount: 10 },
]);
