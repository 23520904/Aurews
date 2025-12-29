// src/utils/dateHelpers.ts

export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  // Format đơn giản: DD/MM/YYYY
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Hàm tính thời gian tương đối (Time Ago)
 * - Dưới 1 phút: "Vừa xong"
 * - Dưới 1 giờ: "x phút trước"
 * - Dưới 24 giờ: "x giờ trước"
 * - Dưới 7 ngày: "x ngày trước"
 * - Trên 7 ngày: Hiển thị ngày tháng (VD: 12/05/2023) -> Fix lỗi "798 ngày trước"
 */
export const getTimeAgo = (dateString: string): string => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ""; // Phòng trường hợp string lỗi

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return "Vừa xong";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return formatDate(dateString);
};

// Giữ lại hàm cũ nếu có chỗ nào dùng, hoặc alias sang getTimeAgo
export const getRelativeTime = getTimeAgo;
