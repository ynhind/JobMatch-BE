import User from "../models/User.js";
import { generateToken } from "../utils/jwt.utils.js";
import { sendSuccess, sendError, asyncHandler } from "../utils/helpers.js";
import { sendEmail, emailTemplates } from "../utils/email.utils.js";

// @desc    Register user (Job Seeker or Employer)
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, "Email already registered", 400);
  }

  // Create user
  const user = await User.create({
    email,
    password,
    role,
    firstName: name?.split(" ")[0] || "",
    lastName: name?.split(" ").slice(1).join(" ") || "",
  });

  // Generate JWT token
  const token = generateToken({ id: user._id, role: user.role });

  // Send welcome email (async, don't wait)
  if (process.env.EMAIL_USER) {
    sendEmail({
      to: user.email,
      ...emailTemplates.welcome(name || user.email),
    });
  }

  return sendSuccess(
    res,
    {
      token,
      userId: user._id,
      role: user.role,
    },
    "Successfully registered",
    201
  );
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password field
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return sendError(res, "Invalid credentials", 401);
  }

  // Check if account is active
  if (!user.isActive) {
    return sendError(res, "Your account has been deactivated", 403);
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return sendError(res, "Invalid credentials", 401);
  }

  // Generate JWT token
  const token = generateToken({ id: user._id, role: user.role });

  return sendSuccess(res, {
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.fullName,
    },
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("company", "companyName logoUrl isVerified")
    .select("-password");

  if (!user) {
    return sendError(res, "User not found", 404);
  }

  return sendSuccess(res, {
    id: user._id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    location: user.location,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    company: user.company,
    createdAt: user.createdAt,
  });
});

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return sendError(res, "Please provide current and new password", 400);
  }

  // Get user with password
  const user = await User.findById(req.user._id).select("+password");

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    return sendError(res, "Current password is incorrect", 401);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  return sendSuccess(res, null, "Password updated successfully");
});
