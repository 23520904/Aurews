// src/utils/fileUpload.js
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

// --- CÁC UPLOADER ---

// A. Avatar
const avatarStorage = createCloudinaryStorage("users/avatars");
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("avatar");

// B. Upload Ảnh Bìa (Thumbnail) -> SỬA TẠI ĐÂY
const postImageStorage = createCloudinaryStorage("posts/thumbnails");
export const postImageUpload = multer({
  storage: postImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("thumbnail"); // <--- ĐỔI TỪ "image" THÀNH "thumbnail"

// C. Upload Editor (Ảnh trong nội dung bài viết) -> THÊM MỚI
// Frontend Editor gửi key là "file"
const editorStorage = createCloudinaryStorage("posts/content");
export const uploadEditorImage = multer({
  storage: editorStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("file"); // <--- Key là "file"

// D. Upload Gallery (Giữ nguyên nếu dùng cho mục đích khác)
const postMediaStorage = createCloudinaryStorage("posts/media");
export const uploadPostMedia = multer({
  storage: postMediaStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
}).array("images", 10);

// E. Author Application (Giữ nguyên)
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
