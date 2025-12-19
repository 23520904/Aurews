/**
 * Tạo một đối tượng lỗi tùy chỉnh
 * @param {number} statusCode - Mã trạng thái HTTP (ví dụ: 400, 401, 403, 404, 500)
 * @param {string} message - Thông báo lỗi hiển thị cho người dùng
 * @returns {Error} - Đối tượng lỗi đã được gắn statusCode
 */
export const errorHandler = (statusCode, message) => {
  const error = new Error();
  error.statusCode = statusCode;
  error.message = message;
  return error;
};
