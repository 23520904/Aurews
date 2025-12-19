import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import { errorHandler } from "../utils/error.js";

// 1. LẤY BÌNH LUẬN (Hỗ trợ Lazy Loading)
// GET /api/comments/:postId?parentId=...
export const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { parentId } = req.query; // Query param: ?parentId=XYZ

    const query = { post: postId };

    // LOGIC LAZY LOAD:
    if (parentId) {
      // Nếu có parentId -> Lấy danh sách con (Replies)
      query.parentComment = parentId;
    } else {
      // Nếu không -> Chỉ lấy danh sách cha (Root)
      query.parentComment = null;
    }

    // Populate thông tin người comment
    const comments = await Comment.find(query)
      .populate("user", "fullName avatar")
      .sort({ createdAt: -1 }); // Mới nhất lên đầu

    // Mẹo UX: Trả về thêm field "replyCount" cho mỗi comment cha
    // (Ở đây để đơn giản ta tạm bỏ qua, Frontend có thể tự count nếu load hết)

    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

// 2. TẠO BÌNH LUẬN MỚI
export const createComment = async (req, res, next) => {
  try {
    const { content, parentCommentId } = req.body;
    const { postId } = req.params;
    const userId = req.user._id;

    if (!content) {
      return next(errorHandler(400, "Nội dung bình luận không được để trống"));
    }

    const newComment = new Comment({
      text: content,
      post: postId,
      user: userId,
      parentComment: parentCommentId || null,
    });

    await newComment.save();

    // Tự động tăng count comment trong Post (Nếu Model chưa có hook thì thêm dòng này)
    await Post.findByIdAndUpdate(postId, { $inc: { comments: 1 } });

    // Trả về data kèm info user để Frontend append ngay lập tức (Optimistic UI)
    const populatedComment = await Comment.findById(newComment._id).populate(
      "user",
      "fullName avatar"
    );

    res.status(201).json(populatedComment);
  } catch (error) {
    next(error);
  }
};

// 3. XÓA BÌNH LUẬN
export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) return next(errorHandler(404, "Comment not found"));

    // Check quyền: Chỉ chủ comment hoặc Admin mới được xóa
    if (
      req.user.role !== "admin" &&
      comment.user.toString() !== req.user._id.toString()
    ) {
      return next(errorHandler(403, "Bạn không có quyền xóa bình luận này"));
    }

    await Comment.findByIdAndDelete(commentId);

    // Giảm count comment trong Post
    await Post.findByIdAndUpdate(comment.post, { $inc: { comments: -1 } });

    res.status(200).json("Bình luận đã được xóa");
  } catch (error) {
    next(error);
  }
};
