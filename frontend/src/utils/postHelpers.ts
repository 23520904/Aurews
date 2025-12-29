// src/utils/postHelpers.ts

/**
 * Hàm lấy tên tác giả an toàn
 * Logic: Ưu tiên lấy từ User nội bộ (authorUser), nếu không có thì lấy từ nguồn cào (author)
 */
export const getAuthorName = (post: any): string => {
    if (post.authorUser && post.authorUser.fullName) {
        return post.authorUser.fullName;
    }
    if (post.author && post.author.name) {
        return post.author.name;
    }
    return "Unknown Author";
};

/**
 * Hàm lấy avatar tác giả an toàn
 */
export const getAuthorAvatar = (post: any): string => {
    if (post.authorUser && post.authorUser.avatar) {
        return post.authorUser.avatar;
    }
    if (post.author && post.author.avatar) {
        return post.author.avatar;
    }
    // Avatar mặc định nếu không tìm thấy gì
    return "https://avatar.iran.liara.run/public";
};