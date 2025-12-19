import Report from "../models/report.model.js";
import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import User from "../models/user.model.js";
import sendEmail from "../utils/sendEmail.js";
import { errorHandler } from "../utils/error.js";

// === 1. TẠO BÁO CÁO (USER) ===
export const createReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason } = req.body;
    const reporterId = req.user._id;

    // Validate Input
    if (!["Post", "Comment", "User"].includes(targetType)) {
      return next(errorHandler(400, "Loại đối tượng báo cáo không hợp lệ"));
    }

    // Kiểm tra xem đối tượng có tồn tại không
    let targetExists = null;
    if (targetType === "Post") targetExists = await Post.findById(targetId);
    if (targetType === "Comment")
      targetExists = await Comment.findById(targetId);
    if (targetType === "User") targetExists = await User.findById(targetId);

    if (!targetExists) {
      return next(errorHandler(404, "Nội dung bạn báo cáo không còn tồn tại"));
    }

    // Tạo báo cáo mới
    const newReport = new Report({
      reporter: reporterId,
      targetType,
      targetId,
      reason,
      status: "pending",
    });

    await newReport.save();

    res.status(201).json({
      success: true,
      message: "Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét sớm nhất.",
    });
  } catch (error) {
    next(error);
  }
};

// === 2. LẤY DANH SÁCH BÁO CÁO (ADMIN) ===
export const getAllReports = async (req, res, next) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    const query = {};
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate("reporter", "fullName email avatar") // Ai báo cáo?
      .populate("targetId") // Lấy luôn nội dung của Post/Comment/User bị báo cáo
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.status(200).json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalReports: total,
    });
  } catch (error) {
    next(error);
  }
};

// === 3. XỬ LÝ BÁO CÁO (ADMIN RESOLVE) ===
export const resolveReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { status, adminNote } = req.body; // status: "resolved" (Đã xử lý xong/Đã phạt) hoặc "rejected" (Báo cáo sai)

    if (!["resolved", "rejected"].includes(status)) {
      return next(errorHandler(400, "Trạng thái không hợp lệ"));
    }

    const report = await Report.findById(reportId);
    if (!report) return next(errorHandler(404, "Không tìm thấy báo cáo"));

    // Cập nhật Report
    report.status = status;
    report.adminNote = adminNote;
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();

    await report.save();

    // --- GỬI EMAIL THÔNG BÁO (NẾU CẦN) ---
    // Logic: Nếu Admin xử lý xong (resolved), tức là có vi phạm -> Gửi mail cảnh báo user vi phạm
    if (status === "resolved") {
      try {
        // 1. Tìm User sở hữu nội dung bị báo cáo
        let ownerId = null;
        let violatorEmail = null;

        // Populate để lấy thông tin owner
        await report.populate("targetId");
        const target = report.targetId;

        if (report.targetType === "Post") ownerId = target.authorUser;
        else if (report.targetType === "Comment") ownerId = target.user;
        else if (report.targetType === "User") ownerId = target._id;

        if (ownerId) {
          const owner = await User.findById(ownerId);
          if (owner) violatorEmail = owner.email;
        }

        // 2. Gửi Email
        if (violatorEmail) {
          await sendEmail({
            email: violatorEmail,
            subject: "Aurews - Thông báo về nội dung của bạn",
            html: `
                        <h3>Chào bạn,</h3>
                        <p>Nội dung của bạn trên Aurews đã bị báo cáo và xử lý do vi phạm tiêu chuẩn cộng đồng.</p>
                        <p><strong>Lý do:</strong> ${report.reason}</p>
                        <p><strong>Quyết định của Admin:</strong> ${adminNote}</p>
                        <p>Vui lòng tuân thủ quy định để tránh bị khóa tài khoản.</p>
                        <p>Trân trọng,<br>Aurews Team</p>
                    `,
          });
        }
      } catch (emailError) {
        console.error("Lỗi gửi mail cảnh báo:", emailError.message);
        // Không return lỗi để tránh block flow chính
      }
    }

    res.status(200).json({ message: "Đã xử lý báo cáo thành công", report });
  } catch (error) {
    next(error);
  }
};
