import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
export const getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
export const updateProfile = async (req, res) => {
  try {
    const { fullName, bio, avatar } = req.body;
    if (!fullName || fullName === "")
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    let cloudinaryResponse = null;
    if (avatar) {
      cloudinaryResponse = await cloudinary.uploader.upload(avatar, {
        folder: "profiles",
      });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          fullName,
          bio,
          avatar: cloudinaryResponse?.secure_url
            ? cloudinaryResponse.secure_url
            : "",
        },
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile upadated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
