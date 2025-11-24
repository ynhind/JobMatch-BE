import Company from "../models/Company.js";
import FollowCompany from "../models/FollowCompany.js";
import Job from "../models/Job.js";
import Notification from "../models/Notification.js";
import JobAlert from "../models/JobAlert.js";
import User from "../models/User.js";
import {
  sendSuccess,
  sendError,
  asyncHandler,
  getPagination,
  formatPaginationResponse,
} from "../utils/helpers.js";

// ============= COMPANIES =============

// @desc    Search companies
// @route   GET /api/js/companies
// @access  Public
export const searchCompanies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, name, location, industry } = req.query;
  const { skip, limit: limitNum } = getPagination(page, limit);

  // Only show companies that have at least one open job (instead of requiring verification)
  const query = {};

  if (name) {
    query.companyName = { $regex: name, $options: "i" };
  }

  if (location) {
    query.city = { $regex: location, $options: "i" };
  }

  if (industry) {
    query.industry = { $regex: industry, $options: "i" };
  }

  // Get companies with their job counts
  const companies = await Company.find(query)
    .select(
      "companyName logoUrl description city industry companySize totalJobs totalFollowers isVerified"
    )
    .sort({ totalJobs: -1, totalFollowers: -1, createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Company.countDocuments(query);

  return sendSuccess(
    res,
    formatPaginationResponse(companies, total, page, limitNum),
    "Companies retrieved successfully"
  );
});

// @desc    Get company detail
// @route   GET /api/js/companies/:id
// @access  Public
export const getCompanyDetail = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);

  if (!company) {
    return sendError(res, "Company not found", 404);
  }

  // Get active jobs
  const jobs = await Job.find({ company: req.params.id, status: "open" })
    .select("title location salaryRange jobType createdAt")
    .sort({ createdAt: -1 })
    .limit(10);

  return sendSuccess(res, {
    info: company,
    jobs,
  });
});

// @desc    Follow company
// @route   POST /api/js/companies/:id/follow
// @access  Private (Job Seeker)
export const followCompany = asyncHandler(async (req, res) => {
  const companyId = req.params.id;

  // Check if company exists
  const company = await Company.findById(companyId);
  if (!company) {
    return sendError(res, "Company not found", 404);
  }

  // Check if already following
  const existingFollow = await FollowCompany.findOne({
    jobSeeker: req.user._id,
    company: companyId,
  });

  if (existingFollow) {
    return sendError(res, "Already following this company", 400);
  }

  // Create follow
  await FollowCompany.create({
    jobSeeker: req.user._id,
    company: companyId,
  });

  // Update company's follower count
  company.totalFollowers += 1;
  await company.save();

  return sendSuccess(res, null, "Successfully followed company", 201);
});

// @desc    Unfollow company
// @route   DELETE /api/js/companies/:id/follow
// @access  Private (Job Seeker)
export const unfollowCompany = asyncHandler(async (req, res) => {
  const companyId = req.params.id;

  const follow = await FollowCompany.findOneAndDelete({
    jobSeeker: req.user._id,
    company: companyId,
  });

  if (!follow) {
    return sendError(res, "Not following this company", 404);
  }

  // Update company's follower count
  await Company.findByIdAndUpdate(companyId, { $inc: { totalFollowers: -1 } });

  return sendSuccess(res, null, "Successfully unfollowed company");
});

// @desc    Get following companies
// @route   GET /api/js/companies/following
// @access  Private (Job Seeker)
export const getFollowingCompanies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { skip, limit: limitNum } = getPagination(page, limit);

  const following = await FollowCompany.find({ jobSeeker: req.user._id })
    .populate("company", "companyName logoUrl description city totalJobs")
    .sort({ followedAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await FollowCompany.countDocuments({ jobSeeker: req.user._id });

  return sendSuccess(
    res,
    formatPaginationResponse(following, total, page, limitNum),
    "Following companies retrieved successfully"
  );
});

// ============= NOTIFICATIONS =============

// @desc    Get notifications
// @route   GET /api/js/notifications
// @access  Private (Job Seeker)
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isRead } = req.query;
  const { skip, limit: limitNum } = getPagination(page, limit);

  const query = { recipient: req.user._id };
  if (isRead !== undefined) {
    query.isRead = isRead === "true";
  }

  const notifications = await Notification.find(query)
    .populate("relatedJob", "title")
    .populate("relatedCompany", "companyName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  return sendSuccess(res, {
    ...formatPaginationResponse(notifications, total, page, limitNum),
    unreadCount,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/js/notifications/:id/read
// @access  Private (Job Seeker)
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    return sendError(res, "Notification not found", 404);
  }

  return sendSuccess(res, notification, "Notification marked as read");
});

// @desc    Mark all notifications as read
// @route   PUT /api/js/notifications/read-all
// @access  Private (Job Seeker)
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return sendSuccess(res, null, "All notifications marked as read");
});

// ============= JOB ALERTS =============

// @desc    Create job alert
// @route   POST /api/js/alert
// @access  Private (Job Seeker)
export const createJobAlert = asyncHandler(async (req, res) => {
  const alertData = {
    jobSeeker: req.user._id,
    ...req.body,
  };

  const alert = await JobAlert.create(alertData);

  return sendSuccess(res, alert, "Job alert created successfully", 201);
});

// @desc    Get job alerts
// @route   GET /api/js/alert
// @access  Private (Job Seeker)
export const getJobAlerts = asyncHandler(async (req, res) => {
  const alerts = await JobAlert.find({ jobSeeker: req.user._id }).sort({
    createdAt: -1,
  });

  return sendSuccess(res, alerts);
});

// @desc    Update job alert
// @route   PUT /api/js/alert/:id
// @access  Private (Job Seeker)
export const updateJobAlert = asyncHandler(async (req, res) => {
  const alert = await JobAlert.findOneAndUpdate(
    { _id: req.params.id, jobSeeker: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!alert) {
    return sendError(res, "Job alert not found", 404);
  }

  return sendSuccess(res, alert, "Job alert updated successfully");
});

// @desc    Delete job alert
// @route   DELETE /api/js/alert/:id
// @access  Private (Job Seeker)
export const deleteJobAlert = asyncHandler(async (req, res) => {
  const alert = await JobAlert.findOneAndDelete({
    _id: req.params.id,
    jobSeeker: req.user._id,
  });

  if (!alert) {
    return sendError(res, "Job alert not found", 404);
  }

  return sendSuccess(res, null, "Job alert deleted successfully");
});

// @desc    Toggle job alert on/off
// @route   PUT /api/js/alert/:id/toggle
// @access  Private (Job Seeker)
export const toggleJobAlert = asyncHandler(async (req, res) => {
  const alert = await JobAlert.findOne({
    _id: req.params.id,
    jobSeeker: req.user._id,
  });

  if (!alert) {
    return sendError(res, "Job alert not found", 404);
  }

  alert.isActive = !alert.isActive;
  await alert.save();

  return sendSuccess(
    res,
    alert,
    `Job alert ${alert.isActive ? "activated" : "deactivated"}`
  );
});

// ============= SETTINGS =============

// @desc    Get user settings
// @route   GET /api/js/settings
// @access  Private (Job Seeker)
export const getSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("settings email");

  return sendSuccess(res, {
    email: user.email,
    ...user.settings,
  });
});

// @desc    Update settings
// @route   PUT /api/js/settings
// @access  Private (Job Seeker)
export const updateSettings = asyncHandler(async (req, res) => {
  const { emailNotifications, jobAlerts, profileVisibility } = req.body;

  const settings = {};
  if (emailNotifications !== undefined)
    settings["settings.emailNotifications"] = emailNotifications;
  if (jobAlerts !== undefined) settings["settings.jobAlerts"] = jobAlerts;
  if (profileVisibility !== undefined)
    settings["settings.profileVisibility"] = profileVisibility;

  const user = await User.findByIdAndUpdate(req.user._id, settings, {
    new: true,
  }).select("settings");

  return sendSuccess(res, user.settings, "Settings updated successfully");
});

// @desc    Change password
// @route   PUT /api/js/settings/password
// @access  Private (Job Seeker)
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return sendError(res, "Please provide current and new password", 400);
  }

  if (newPassword.length < 6) {
    return sendError(res, "New password must be at least 6 characters", 400);
  }

  const user = await User.findById(req.user._id).select("+password");

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    return sendError(res, "Current password is incorrect", 401);
  }

  user.password = newPassword;
  await user.save();

  return sendSuccess(res, null, "Password changed successfully");
});

// @desc    Delete account
// @route   DELETE /api/js/settings/account
// @access  Private (Job Seeker)
export const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return sendError(
      res,
      "Please provide your password to delete account",
      400
    );
  }

  const user = await User.findById(req.user._id).select("+password");

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return sendError(res, "Password is incorrect", 401);
  }

  // Delete user account (consider soft delete in production)
  await User.findByIdAndDelete(req.user._id);

  return sendSuccess(res, null, "Account deleted successfully");
});

export default {
  searchCompanies,
  getCompanyDetail,
  followCompany,
  unfollowCompany,
  getFollowingCompanies,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createJobAlert,
  getJobAlerts,
  updateJobAlert,
  deleteJobAlert,
  toggleJobAlert,
  getSettings,
  updateSettings,
  changePassword,
  deleteAccount,
};
