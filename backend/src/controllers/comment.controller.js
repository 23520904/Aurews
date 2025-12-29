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
    let comments = await Comment.find(query)
      .populate("user", "fullName avatar username role")
      .sort({ createdAt: -1 })
      .lean(); // Use lean to modify the object

    // Nếu đang lấy comment gốc, đếm số reply cho mỗi comment
    if (!parentId) {
      const commentIds = comments.map((c) => c._id);

      // Aggregate counts of replies where parentComment is in our list
      const replyCounts = await Comment.aggregate([
        { $match: { parentComment: { $in: commentIds } } },
        { $group: { _id: "$parentComment", count: { $sum: 1 } } },
      ]);

      // Map counts back to comments
      const countMap = {};
      replyCounts.forEach((rc) => {
        countMap[rc._id.toString()] = rc.count;
      });

      comments = comments.map((c) => ({
        ...c,
        replyCount: countMap[c._id.toString()] || 0,
      }));
    }

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
      "fullName avatar username role"
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
    const commentUserId = comment.user._id
      ? comment.user._id.toString()
      : comment.user.toString();
    if (
      req.user.role !== "admin" &&
      commentUserId !== req.user._id.toString()
    ) {
      return next(errorHandler(403, "Bạn không có quyền xóa bình luận này"));
    }

    // 1. Xóa comment hiện tại
    await Comment.findByIdAndDelete(commentId);

    // 2. Nếu là comment cha, xóa hết các reply con
    let deletedCount = 1;
    if (!comment.parentComment) {
      const deleteResult = await Comment.deleteMany({
        parentComment: commentId,
      });
      deletedCount += deleteResult.deletedCount;
    }

    // 3. Giảm count trong Post (Trừ đi tổng số comment cha + con đã xóa)
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { comments: -deletedCount },
    });

    res.status(200).json("Bình luận đã được xóa");
  } catch (error) {
    next(error);
  }
};

// 4. LIKE / UNLIKE BÌNH LUẬN
export const toggleLikeComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) return next(errorHandler(404, "Comment not found"));

    const isLiked = comment.likesBy.some(
      (id) => id.toString() === userId.toString()
    );

    if (isLiked) {
      // Unlike
      await Comment.findByIdAndUpdate(commentId, {
        $pull: { likesBy: userId },
      });
    } else {
      // Like
      await Comment.findByIdAndUpdate(commentId, {
        $addToSet: { likesBy: userId },
      });
    }

    // Sync likes count explicitly: Fetch updated doc -> Count -> Update
    // This is the most robust way to ensure 'likes' matches 'likesBy.length'
    const currentComment = await Comment.findById(commentId);
    if (currentComment) {
      currentComment.likes = currentComment.likesBy.length;
      await currentComment.save();
    }

    // Return the updated state
    const finalComment = await Comment.findById(commentId);
    const newIsLiked = finalComment.likesBy.some(
      (id) => id.toString() === userId.toString()
    );

    res.status(200).json({
      message: newIsLiked ? "Liked comment" : "Unliked comment",
      isLiked: newIsLiked,
    });
  } catch (error) {
    next(error);
  }
};
