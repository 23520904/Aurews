export enum UserRole {
    Reader = 'reader',
    Author = 'author',
    Admin = 'admin',
  }
  
  export enum ApplicationStatus {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
  }
  
  export enum PostCategory {
    News = 'news',
    Technology = 'technology',
    Sports = 'sports',
    Entertainment = 'entertainment',
    Business = 'business',
    Health = 'health',
    Politics = 'politics',
    Science = 'science',
    Other = 'other',
  }
  
  export enum PostStatus {
    Draft = 'draft',
    Published = 'published',
    Archived = 'archived',
    Scheduled = 'scheduled',
    Deleted = 'deleted',
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
    category: PostCategory;
    thumbnail: string;
    images?: Array<{ url: string; caption?: string }>;
    author: {
      name: string;
      avatar?: string;
      bio?: string;
    };
    authorUser?: User | string; // If internal
    source: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    status: PostStatus;
    featured: boolean;
    publishTime: string;
    readTime: number;
    tags?: string[];
    engagement?: number; // Virtual
  }
  
  export interface Comment {
    _id: string;
    post: string;
    user: User; // Populated
    text: string;
    parentComment?: string | null;
    likes: number;
    isEdited: boolean;
    isDeleted: boolean;
    createdAt: string;
  }
  
  export interface Notification {
    _id: string;
    recipient: string;
    sender: User;
    type: 'like_post' | 'comment_post' | 'reply_comment' | 'follow' | 'system_alert' | 'post_approved' | 'post_rejected';
    relatedId: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
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