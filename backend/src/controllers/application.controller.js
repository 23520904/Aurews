import mongoose from "mongoose";
import AuthorApplication from "../models/authorApplication.model.js";
import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";
import AuthorStats from "../models/authorStats.model.js";

// === 1. USER NỘP ĐƠN (SUBMIT APPLICATION) ===
export const submitApplication = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Kiểm tra xem user này đã nộp đơn chưa?
    const existingApp = await AuthorApplication.findOne({ user: userId });
    if (existingApp) {
      if (existingApp.status === "pending") {
        return next(
          errorHandler(400, "Bạn đã có một đơn đang chờ duyệt. Vui lòng kiên nhẫn.")
        );
      }
      if (existingApp.status === "approved") {
        return next(errorHandler(400, "Bạn đã là tác giả rồi!"));
      }
      // Nếu status là 'rejected', cho phép nộp lại (logic ghi đè hoặc tạo mới tùy bạn - ở đây ta chọn Update đơn cũ)
    }

    // 2. Lấy dữ liệu Text từ Body
    const { motivation, experience, phoneNumber, externalLinks } = req.body;

    // Parse JSON externalLinks nếu gửi từ Form Data (vì FormData gửi object dạng string)
    let parsedLinks = {};
    try {
      parsedLinks = externalLinks ? JSON.parse(externalLinks) : {};
    } catch (e) {
      parsedLinks = {}; // Fallback nếu lỗi parse
    }

    // 3. Xử lý File Upload (Từ Multer)
    const files = req.files || {};

    // Validate: Bắt buộc phải có đủ 2 mặt CCCD
    if (!files.identityCard || files.identityCard.length < 2) {
      return next(
        errorHandler(400, "Vui lòng tải lên đủ mặt trước và mặt sau CCCD/CMND.")
      );
    }

    // Validate: Phải có ít nhất 1 file chứng chỉ hoặc portfolio (Tùy chọn, ở đây mình để optional)

    // Helper function để map file
    const mapFile = (file) => ({
      url: file.path, // Link Cloudinary
      fileName: file.filename,
      fileType: file.mimetype,
      uploadedAt: new Date(),
    });

    // Cấu trúc dữ liệu Documents theo Model
    const documentsData = {
      identityCard: {
        front: files.identityCard[0].path, // Ảnh đầu tiên là mặt trước
        back: files.identityCard[1].path, // Ảnh thứ hai là mặt sau
      },
      certificates: files.certificates ? files.certificates.map(mapFile) : [],
      portfolio: files.portfolio ? files.portfolio.map(mapFile) : [],
    };

    // 4. Lưu vào Database
    // Nếu đơn bị từ chối trước đó -> Update lại
    if (existingApp && existingApp.status === "rejected") {
      existingApp.motivation = motivation;
      existingApp.experience = experience;
      existingApp.documents = documentsData;
      existingApp.phoneNumber = phoneNumber;
      existingApp.externalLinks = parsedLinks;
      existingApp.status = "pending"; // Reset trạng thái chờ duyệt
      existingApp.submittedAt = new Date();
      existingApp.rejectionReason = undefined; // Xóa lý do từ chối cũ

      await existingApp.save();
      return res.status(200).json({
        message: "Đơn đăng ký của bạn đã được cập nhật và gửi lại!",
        application: existingApp,
      });
    }

    // Nếu chưa có đơn -> Tạo mới
    const newApp = new AuthorApplication({
      user: userId,
      motivation,
      experience,
      documents: documentsData,
      phoneNumber,
      externalLinks: parsedLinks,
      submittedAt: new Date(),
      status: "pending",
    });

    await newApp.save();

    // Cập nhật User để biết user này đã có đơn (dùng cho việc check nhanh ở Frontend)
    await User.findByIdAndUpdate(userId, { authorApplication: newApp._id });

    res.status(201).json({
      message: "Nộp đơn thành công! Vui lòng chờ Admin xét duyệt.",
      application: newApp,
    });
  } catch (error) {
    next(error);
  }
};

// === 2. USER XEM TRẠNG THÁI ĐƠN CỦA MÌNH ===
export const getMyApplication = async (req, res, next) => {
  try {
    const application = await AuthorApplication.findOne({ user: req.user._id });
    if (!application) {
      return next(errorHandler(404, "Bạn chưa gửi đơn đăng ký nào."));
    }
    res.status(200).json(application);
  } catch (error) {
    next(error);
  }
};

// === 3. ADMIN: LẤY DANH SÁCH ĐƠN (CÓ FILTER) ===
export const getAllApplications = async (req, res, next) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    const query = {};

    if (status) query.status = status; // Lọc theo pending/approved/rejected

    const applications = await AuthorApplication.find(query)
      .populate("user", "fullName email avatar username") // Hiện thông tin người nộp
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await AuthorApplication.countDocuments(query);

    res.status(200).json({
      applications,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalApplications: total,
    });
  } catch (error) {
    next(error);
  }
};

// === 4. ADMIN: DUYỆT HOẶC TỪ CHỐI ĐƠN ===
export const reviewApplication = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { applicationId } = req.params;
    const { status, rejectionReason } = req.body; // status: "approved" | "rejected"

    if (!["approved", "rejected"].includes(status)) {
      await session.abortTransaction();
      return next(errorHandler(400, "Trạng thái không hợp lệ."));
    }

    if (status === "rejected" && !rejectionReason) {
      await session.abortTransaction();
      return next(errorHandler(400, "Vui lòng cung cấp lý do từ chối."));
    }

    // Dùng session trong query để đảm bảo nằm trong transaction
    const application = await AuthorApplication.findById(applicationId).session(
      session
    );
    if (!application) {
      await session.abortTransaction();
      return next(errorHandler(404, "Không tìm thấy đơn đăng ký."));
    }

    // Cập nhật trạng thái đơn
    application.status = status;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    if (status === "rejected") {
      application.rejectionReason = rejectionReason;
    }

    await application.save({ session });

    // LOGIC QUAN TRỌNG: NẾU DUYỆT (APPROVED) -> NÂNG CẤP USER THÀNH AUTHOR
    if (status === "approved") {
      await User.findByIdAndUpdate(
        application.user,
        {
          role: "author",
          // Có thể khởi tạo luôn AuthorStats ở đây nếu muốn
        },
        { session }
      );

      // Tạo AuthorStats mặc định (nếu chưa có) để tránh lỗi logic sau này
      // Sử dụng upsert để an toàn
      await AuthorStats.findOneAndUpdate(
        { user: application.user },
        { user: application.user }, // Không cần set fields khác vì mặc định là 0
        { upsert: true, new: true, session }
      );

      // TODO: Gửi thông báo (Notification) cho User: "Chúc mừng bạn đã trở thành tác giả!"
      // TODO: Gửi Email chúc mừng
    }

    await session.commitTransaction();

    res.status(200).json({
      message: `Đã ${
        status === "approved" ? "duyệt" : "từ chối"
      } đơn đăng ký thành công.`,
      application,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};