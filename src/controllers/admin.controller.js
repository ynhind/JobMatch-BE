import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import Report from "../models/Report.js";
import { generateToken } from "../utils/jwt.utils.js";
import {
  sendSuccess,
  sendError,
  asyncHandler,
  getPagination,
  formatPaginationResponse,
} from "../utils/helpers.js";

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find admin
  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin) {
    return sendError(res, "Invalid credentials", 401);
  }

  // Verify password
  const isPasswordValid = await admin.comparePassword(password);
  if (!isPasswordValid) {
    return sendError(res, "Invalid credentials", 401);
  }

  // Generate JWT token
  const token = generateToken({ id: admin._id, role: "admin" });

  return sendSuccess(res, {
    token,
    admin: {
      id: admin._id,
      email: admin.email,
      name: admin.name,
    },
  });
});

// @desc    Get all users (Job Seekers and Employers)
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, isActive, search } = req.query;
  const { skip, limit: limitNum } = getPagination(page, limit);

  // Build query
  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === "true";
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
    ];
  }

  // Get users with pagination
  const users = await User.find(query)
    .populate("company", "companyName isVerified")
    .select("-password")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await User.countDocuments(query);

  const formattedUsers = users.map((user) => ({
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    company: user.company,
    createdAt: user.createdAt,
  }));

  return sendSuccess(
    res,
    formatPaginationResponse(formattedUsers, total, page, limitNum),
    "Users retrieved successfully"
  );
});

// @desc    Update user status (activate/deactivate)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const user = await User.findByIdAndUpdate(
    id,
    { isActive },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    return sendError(res, "User not found", 404);
  }

  return sendSuccess(res, user, "User status updated");
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return sendError(res, "User not found", 404);
  }

  // Also delete associated company if employer
  if (user.role === "employer" && user.company) {
    await Company.findByIdAndDelete(user.company);
  }

  return sendSuccess(res, null, "User deleted successfully");
});

// @desc    Verify company
// @route   PATCH /api/admin/company/:id/verify
// @access  Private (Admin)
export const verifyCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'verified' or 'rejected'

  if (!["verified", "rejected"].includes(status)) {
    return sendError(res, "Invalid status. Must be verified or rejected", 400);
  }

  const company = await Company.findById(id);
  if (!company) {
    return sendError(res, "Company not found", 404);
  }

  company.verificationStatus = status;
  company.isVerified = status === "verified";
  company.verifiedAt = status === "verified" ? new Date() : null;
  await company.save();

  return sendSuccess(res, company, `Company ${status}`);
});

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private (Admin)
export const getReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, targetType } = req.query;
  const { skip, limit: limitNum } = getPagination(page, limit);

  const query = {};
  if (status) query.status = status;
  if (targetType) query.targetType = targetType;

  const reports = await Report.find(query)
    .populate("reporter", "email firstName lastName")
    .populate("reviewedBy", "email name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Report.countDocuments(query);

  return sendSuccess(
    res,
    formatPaginationResponse(reports, total, page, limitNum),
    "Reports retrieved successfully"
  );
});

// @desc    Create report
// @route   POST /api/reports
// @access  Private
export const createReport = asyncHandler(async (req, res) => {
  const { targetId, targetType, reason, description } = req.body;

  const report = await Report.create({
    reporter: req.user._id,
    targetId,
    targetType: targetType || "user",
    reason,
    description,
  });

  return sendSuccess(res, report, "Report submitted successfully", 201);
});

// @desc    Update report status
// @route   PATCH /api/admin/reports/:id
// @access  Private (Admin)
export const updateReportStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, actionTaken } = req.body;

  const report = await Report.findByIdAndUpdate(
    id,
    {
      status,
      actionTaken,
      reviewedBy: req.admin._id,
      reviewedAt: new Date(),
    },
    { new: true }
  );

  if (!report) {
    return sendError(res, "Report not found", 404);
  }

  return sendSuccess(res, report, "Report status updated");
});

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getAdminStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalJobSeekers = await User.countDocuments({ role: "js" });
  const totalEmployers = await User.countDocuments({ role: "employer" });
  const totalCompanies = await Company.countDocuments();
  const verifiedCompanies = await Company.countDocuments({ isVerified: true });
  const pendingReports = await Report.countDocuments({ status: "pending" });

  return sendSuccess(res, {
    totalUsers,
    totalJobSeekers,
    totalEmployers,
    totalCompanies,
    verifiedCompanies,
    pendingReports,
  });
});
