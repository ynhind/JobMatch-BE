import Company from "../models/Company.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import {
  sendSuccess,
  sendError,
  asyncHandler,
  getPagination,
  formatPaginationResponse,
} from "../utils/helpers.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../middleware/upload.middleware.js";
import { sendEmail, emailTemplates } from "../utils/email.utils.js";

// ============= COMPANY PROFILE =============

// @desc    Create company profile
// @route   POST /api/employer/profile
// @access  Private (Employer)
export const createCompanyProfile = asyncHandler(async (req, res) => {
  // Check if company already exists for this employer
  const existingCompany = await Company.findOne({ employer: req.user._id });
  if (existingCompany) {
    return sendError(res, "Company profile already exists", 400);
  }

  const companyData = {
    employer: req.user._id,
    ...req.body,
  };

  // Upload logo if provided
  if (req.file) {
    const result = await uploadToCloudinary(req.file, "jobmatch/companies");
    companyData.logoUrl = result.url;
  }

  const company = await Company.create(companyData);

  // Update user's company reference
  await User.findByIdAndUpdate(req.user._id, { company: company._id });

  return sendSuccess(res, company, "Company profile created successfully", 201);
});

// @desc    Get my company profile
// @route   GET /api/employer/profile
// @access  Private (Employer)
export const getMyCompanyProfile = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ employer: req.user._id });

  if (!company) {
    return sendError(res, "Company profile not found", 404);
  }

  return sendSuccess(res, company);
});

// @desc    Update company profile
// @route   PUT /api/employer/profile
// @access  Private (Employer)
export const updateCompanyProfile = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ employer: req.user._id });

  if (!company) {
    return sendError(
      res,
      "Company profile not found. Please create one first",
      404
    );
  }

  // Upload new logo if provided
  if (req.file) {
    const result = await uploadToCloudinary(req.file, "jobmatch/companies");
    req.body.logoUrl = result.url;
  }

  const updatedCompany = await Company.findByIdAndUpdate(
    company._id,
    req.body,
    { new: true, runValidators: true }
  );

  return sendSuccess(
    res,
    updatedCompany,
    "Company profile updated successfully"
  );
});

// ============= JOBS MANAGEMENT =============

// @desc    Post a new job
// @route   POST /api/employer/jobs
// @access  Private (Employer)
export const postJob = asyncHandler(async (req, res) => {
  // Check if company profile exists
  const company = await Company.findOne({ employer: req.user._id });
  if (!company) {
    return sendError(
      res,
      "Please create company profile before posting jobs",
      400
    );
  }

  const jobData = {
    employer: req.user._id,
    company: company._id,
    ...req.body,
  };

  const job = await Job.create(jobData);

  // Update company's total jobs count
  company.totalJobs += 1;
  await company.save();

  return sendSuccess(
    res,
    { jobId: job._id, job },
    "Job posted successfully",
    201
  );
});

// @desc    Get my jobs
// @route   GET /api/employer/jobs
// @access  Private (Employer)
export const getMyJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const { skip, limit: limitNum } = getPagination(page, limit);

  const query = { employer: req.user._id };
  if (status) query.status = status;

  const jobs = await Job.find(query)
    .populate("company", "companyName logoUrl")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Job.countDocuments(query);

  return sendSuccess(
    res,
    formatPaginationResponse(jobs, total, page, limitNum),
    "Jobs retrieved successfully"
  );
});

// @desc    Get job by ID
// @route   GET /api/employer/jobs/:id
// @access  Private (Employer)
export const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findOne({
    _id: req.params.id,
    employer: req.user._id,
  }).populate("company", "companyName logoUrl");

  if (!job) {
    return sendError(res, "Job not found", 404);
  }

  return sendSuccess(res, job);
});

// @desc    Update job
// @route   PUT /api/employer/jobs/:id
// @access  Private (Employer)
export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findOneAndUpdate(
    { _id: req.params.id, employer: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!job) {
    return sendError(res, "Job not found", 404);
  }

  return sendSuccess(res, job, "Job updated successfully");
});

// @desc    Update job status (open/closed/draft)
// @route   PATCH /api/employer/jobs/:id
// @access  Private (Employer)
export const updateJobStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const job = await Job.findOneAndUpdate(
    { _id: req.params.id, employer: req.user._id },
    { status },
    { new: true }
  );

  if (!job) {
    return sendError(res, "Job not found", 404);
  }

  return sendSuccess(res, job, "Job status updated");
});

// @desc    Delete job
// @route   DELETE /api/employer/jobs/:id
// @access  Private (Employer)
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findOneAndDelete({
    _id: req.params.id,
    employer: req.user._id,
  });

  if (!job) {
    return sendError(res, "Job not found", 404);
  }

  // Update company's total jobs count
  await Company.findByIdAndUpdate(job.company, { $inc: { totalJobs: -1 } });

  // Delete all applications for this job
  await Application.deleteMany({ job: job._id });

  return sendSuccess(res, null, "Job deleted successfully");
});

// ============= APPLICANTS MANAGEMENT =============

// @desc    Get applicants for a job
// @route   GET /api/employer/jobs/:id/applicants
// @access  Private (Employer)
export const getJobApplicants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const { skip, limit: limitNum } = getPagination(page, limit);

  // Verify job belongs to employer
  const job = await Job.findOne({ _id: req.params.id, employer: req.user._id });
  if (!job) {
    return sendError(res, "Job not found", 404);
  }

  const query = { job: req.params.id };
  if (status) query.status = status;

  const applications = await Application.find(query)
    .populate(
      "jobSeeker",
      "firstName lastName email avatarUrl phone location skills experiences education"
    )
    .populate("job", "title")
    .sort({ appliedAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Application.countDocuments(query);

  return sendSuccess(
    res,
    formatPaginationResponse(applications, total, page, limitNum),
    "Applicants retrieved successfully"
  );
});

// @desc    Update application status
// @route   PATCH /api/employer/applications/:id/status
// @access  Private (Employer)
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, employerNotes } = req.body;

  const application = await Application.findOne({
    _id: req.params.id,
    employer: req.user._id,
  })
    .populate("jobSeeker", "email firstName")
    .populate("job", "title");

  if (!application) {
    return sendError(res, "Application not found", 404);
  }

  application.status = status;
  application.employerNotes = employerNotes || application.employerNotes;
  application.reviewedAt = new Date();
  application.updatedStatusAt = new Date();
  await application.save();

  // Create notification for job seeker
  await Notification.create({
    recipient: application.jobSeeker._id,
    type: "application_status",
    title: "Application Status Updated",
    message: `Your application for ${application.job.title} has been updated to: ${status}`,
    relatedApplication: application._id,
    relatedJob: application.job._id,
  });

  // Send email notification
  if (process.env.EMAIL_USER) {
    sendEmail({
      to: application.jobSeeker.email,
      ...emailTemplates.applicationStatusUpdate(application.job.title, status),
    });
  }

  return sendSuccess(res, application, "Application status updated");
});

// @desc    Get employer dashboard stats
// @route   GET /api/employer/stats
// @access  Private (Employer)
export const getEmployerStats = asyncHandler(async (req, res) => {
  const totalJobs = await Job.countDocuments({ employer: req.user._id });
  const activeJobs = await Job.countDocuments({
    employer: req.user._id,
    status: "open",
  });
  const totalApplications = await Application.countDocuments({
    employer: req.user._id,
  });
  const pendingApplications = await Application.countDocuments({
    employer: req.user._id,
    status: "pending",
  });

  return sendSuccess(res, {
    totalJobs,
    activeJobs,
    totalApplications,
    pendingApplications,
  });
});
