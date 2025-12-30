export enum UserRole {
  Reader = "reader",
  Author = "author",
  Admin = "admin",
}

export enum ApplicationStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
}

export enum PostCategory {
  News = "news",
  Technology = "technology",
  Sports = "sports",
  Entertainment = "entertainment",
  Business = "business",
  Health = "health",
  Politics = "politics",
  Science = "science",
  Other = "other",
  All = "all",
}

export enum PostStatus {
  Draft = "draft",
  Published = "published",
  Archived = "archived",
  Scheduled = "scheduled",
  Deleted = "deleted",
}

export interface User {
  _id: string;
  email: string;
  username: string;
  fullName: string;
  avatar: string;
  bio?: string;
  role: UserRole;
  isVerified: boolean;
  isBanned: boolean;
  followersCount: number;
  followingCount: number;
  authorApplication?: string; // ID
  authorStats?: string; // ID
  createdAt: string;
  isFollowing?: boolean;
}

export interface AuthorStats {
  _id: string;
  user: string;
  totalPosts: number;
  publishedPosts: number;
  totalViews: number;
  totalLikes: number;
  followerCount: number;
}

export interface DocumentFile {
  url: string;
  fileName: string;
  title?: string;
  fileType?: string;
  description?: string;
  uploadedAt: string;
}

export interface AuthorApplication {
  _id: string;
  user: User | string;
  status: ApplicationStatus;
  motivation: string;
  experience?: string;
  documents: {
    identityCard: {
      front: string;
      back: string;
    };
    certificates: DocumentFile[];
    portfolio: DocumentFile[];
  };
  phoneNumber?: string;
  externalLinks?: {
    sampleArticles: Array<{ url: string; title: string; description?: string }>;
    socialMedia: {
      twitter?: string;
      linkedin?: string;
      facebook?: string;
      website?: string;
      other?: string;
    };
  };
  rejectionReason?: string;
  submittedAt: string;
}

export interface Post {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  text: string; // HTML or Markdown content
  content?: string; // Thêm content để khớp với code mới
  category: PostCategory;
  thumbnail: string;
  images?: Array<{ url: string; caption?: string }>;
  author: {
    _id: string;
    name: string;
    fullName?: string;
    avatar?: string;
    bio?: string;
  };
  authorUser?: User | string; // If internal
  source: string;
  views: number;
  likes: number;
  isLiked?: boolean;
  comments: number;
  shares: number;
  status: PostStatus;
  featured: boolean;
  publishTime: string;
  readTime: number;
  tags?: string[];
  engagement?: number; // Virtual
  createdAt: string;
}

export interface Comment {
  _id: string;
  post: string;
  user: User; // Populated
  text: string;
  parentComment?: string | null;
  likes: number;
  likesBy?: string[];
  replyCount: number;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: User;
  type:
    | "like_post"
    | "comment_post"
    | "reply_comment"
    | "follow"
    | "system_alert"
    | "post_approved"
    | "post_rejected";
  relatedId: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  customMessage?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CommentUI extends Comment {
  isLiked: boolean; // Trạng thái user hiện tại đã like
  replies?: CommentUI[]; // Danh sách trả lời (nếu load dạng lồng nhau)
  // replyCount đã có trong Comment (bắt buộc), không cần khai báo lại
}

export interface PostsResponse {
  posts: Post[];
  totalPosts: number;
  currentPage?: number;
  totalPages?: number;
}

// Định nghĩa cấu trúc của 1 object Preference (khớp với Backend Model)
export interface UserPreferences {
  _id: string;
  user: string;
  favoriteCategories: string[];
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  pushNotifications: boolean;
}

// Định nghĩa cấu trúc phản hồi từ API (khớp với res.json của Backend)
export interface PreferencesResponse {
  success: boolean;
  data: UserPreferences;
}

export type ThemeMode = "light" | "dark" | "system";

export interface AuthorStatsResponse {
  success: boolean;
  data: {
    stats: {
      totalViews: number;
      totalLikes: number;
      totalComments: number;
      totalPosts: number;
      followerCount: number; // <--- BẮT BUỘC PHẢI CÓ DÒNG NÀY
    };
    chartData: {
      label: string;
      value: number;
    }[];
  };
}
