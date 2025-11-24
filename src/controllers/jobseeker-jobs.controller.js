import Job from "../models/Job.js";
import Application from "../models/Application.js";
import SavedJob from "../models/SavedJob.js";
import Company from "../models/Company.js";
import FollowCompany from "../models/FollowCompany.js";
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
import { sendEmail, emailTemplates } from "../utils/email.utils.js";

// ============= JOB SEARCH & BROWSE =============

// @desc    Search jobs
// @route   GET /api/js/jobs/search
// @access  Public
export const searchJobs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    keyword,
    location,
    jobType,
    salaryMin,
    category,
    experienceLevel,
  } = req.query;
  const { skip, limit: limitNum } = getPagination(page, limit);

  // Build search query
  const query = { status: "open" };

  if (keyword) {
    query.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
      { skills: { $in: [new RegExp(keyword, "i")] } },
    ];
  }

  if (location) {
    query["location.city"] = { $regex: location, $options: "i" };
  }

  if (jobType) {
    query.jobType = jobType;
  }

  if (salaryMin) {
    query["salaryRange.min"] = { $gte: parseInt(salaryMin) };
  }

  if (category) {
    query.category = category;
  }

  if (experienceLevel) {
    query.experienceLevel = experienceLevel;
  }

  // Get jobs
  const jobs = await Job.find(query)
    .populate("company", "companyName logoUrl city isVerified")
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

// @desc    Get job detail
// @route   GET /api/js/jobs/:id
// @access  Public
export const getJobDetail = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate(
      "company",
      "companyName logoUrl description city country website isVerified"
    )
    .populate("employer", "firstName lastName email");

  if (!job) {
    return sendError(res, "Job not found", 404);
  }

  // Increment view count
  job.totalViews += 1;
  await job.save();

  return sendSuccess(res, job);
});

// @desc    Get recommended jobs (based on user profile)
// @route   GET /api/js/jobs/recommended
// @access  Private (Job Seeker)
export const getRecommendedJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { skip, limit: limitNum } = getPagination(page, limit);

  const user = await User.findById(req.user._id);

  // Build recommendation query based on user's skills and interests
  const query = { status: "open" };

  const orConditions = [];

  // Match by skills
  if (user.skills && user.skills.length > 0) {
    orConditions.push({
      skills: { $in: user.skills.map((skill) => new RegExp(skill, "i")) },
    });
  }

  // Match by desired job titles
  if (
    user.interests?.desiredJobTitles &&
    user.interests.desiredJobTitles.length > 0
  ) {
    orConditions.push({
      title: {
        $in: user.interests.desiredJobTitles.map(
          (title) => new RegExp(title, "i")
        ),
      },
    });
  }

  // Match by desired locations
  if (
    user.interests?.desiredLocations &&
    user.interests.desiredLocations.length > 0
  ) {
    orConditions.push({
      "location.city": {
        $in: user.interests.desiredLocations.map((loc) => new RegExp(loc, "i")),
      },
    });
  }

  if (orConditions.length > 0) {
    query.$or = orConditions;
  }

  const jobs = await Job.find(query)
    .populate("company", "companyName logoUrl isVerified")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Job.countDocuments(query);

  return sendSuccess(
    res,
    formatPaginationResponse(jobs, total, page, limitNum),
    "Recommended jobs retrieved successfully"
  );
});

// ============= JOB APPLICATION =============

// @desc    Apply for job
// @route   POST /api/jobs/:id/apply
// @access  Private (Job Seeker)
export const applyForJob = asyncHandler(async (req, res) => {
  const { resumeId, coverLetter } = req.body;
  const jobId = req.params.id;

  // Check if job exists and is open
  const job = await Job.findById(jobId).populate("company", "companyName");
  if (!job) {
    return sendError(res, "Job not found", 404);
  }

  if (job.status !== "open") {
    return sendError(res, "This job is no longer accepting applications", 400);
  }

  // Check if already applied
  const existingApplication = await Application.findOne({
    job: jobId,
    jobSeeker: req.user._id,
  });

  if (existingApplication) {
    return sendError(res, "You have already applied to this job", 400);
  }

  // Create application
  const application = await Application.create({
    job: jobId,
    jobSeeker: req.user._id,
    employer: job.employer,
    resumeId,
    coverLetter,
  });

  // Update job's total applications
  job.totalApplications += 1;
  await job.save();

  // Create notification for employer
  await Notification.create({
    recipient: job.employer,
    type: "new_applicant",
    title: "New Application Received",
    message: `${req.user.firstName} ${req.user.lastName} has applied for ${job.title}`,
    relatedJob: jobId,
    relatedApplication: application._id,
  });

  // Send email to employer
  if (process.env.EMAIL_USER) {
    const employer = await User.findById(job.employer);
    if (employer) {
      sendEmail({
        to: employer.email,
        ...emailTemplates.newApplicant(job.title, req.user.fullName),
      });
    }
  }

  // Send confirmation email to job seeker
  if (process.env.EMAIL_USER) {
    sendEmail({
      to: req.user.email,
      ...emailTemplates.applicationReceived(job.title, job.company.companyName),
    });
  }

  return sendSuccess(
    res,
    { applicationId: application._id },
    "Application submitted",
    201
  );
});

// @desc    Get my applications
// @route   GET /api/js/applications
// @access  Private (Job Seeker)
export const getMyApplications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const { skip, limit: limitNum } = getPagination(page, limit);

  const query = { jobSeeker: req.user._id };
  if (status) query.status = status;

  const applications = await Application.find(query)
    .populate("job", "title location salaryRange jobType deadline status")
    .populate({
      path: "job",
      populate: { path: "company", select: "companyName logoUrl" },
    })
    .sort({ appliedAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Application.countDocuments(query);

  return sendSuccess(
    res,
    formatPaginationResponse(applications, total, page, limitNum),
    "Applications retrieved successfully"
  );
});

// @desc    Get application details
// @route   GET /api/js/applications/:id
// @access  Private (Job Seeker)
export const getApplicationDetail = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.id,
    jobSeeker: req.user._id,
  })
    .populate("job")
    .populate({
      path: "job",
      populate: { path: "company" },
    });

  if (!application) {
    return sendError(res, "Application not found", 404);
  }

  return sendSuccess(res, application);
});

// @desc    Cancel/withdraw application
// @route   DELETE /api/js/applications/:id
// @access  Private (Job Seeker)
export const cancelApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.id,
    jobSeeker: req.user._id,
  });

  if (!application) {
    return sendError(res, "Application not found", 404);
  }

  // Only allow cancellation if status is pending
  if (application.status !== "pending") {
    return sendError(res, "Cannot withdraw application at this stage", 400);
  }

  application.status = "withdrawn";
  await application.save();

  // Update job's total applications
  await Job.findByIdAndUpdate(application.job, {
    $inc: { totalApplications: -1 },
  });

  return sendSuccess(res, null, "Application withdrawn");
});

// ============= SAVED JOBS =============

// @desc    Save/bookmark a job
// @route   POST /api/js/jobs/saved
// @access  Private (Job Seeker)
export const saveJob = asyncHandler(async (req, res) => {
  const { jobId } = req.body;

  // Check if job exists
  const job = await Job.findById(jobId);
  if (!job) {
    return sendError(res, "Job not found", 404);
  }

  // Check if already saved
  const existingSave = await SavedJob.findOne({
    jobSeeker: req.user._id,
    job: jobId,
  });

  if (existingSave) {
    return sendError(res, "Job already saved", 400);
  }

  // Save job
  const savedJob = await SavedJob.create({
    jobSeeker: req.user._id,
    job: jobId,
  });

  return sendSuccess(res, savedJob, "Job saved successfully", 201);
});

// @desc    Get saved jobs
// @route   GET /api/js/jobs/saved
// @access  Private (Job Seeker)
export const getSavedJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { skip, limit: limitNum } = getPagination(page, limit);

  const savedJobs = await SavedJob.find({ jobSeeker: req.user._id })
    .populate({
      path: "job",
      populate: { path: "company", select: "companyName logoUrl" },
    })
    .sort({ savedAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await SavedJob.countDocuments({ jobSeeker: req.user._id });

  return sendSuccess(
    res,
    formatPaginationResponse(savedJobs, total, page, limitNum),
    "Saved jobs retrieved successfully"
  );
});

// @desc    Unsave job
// @route   DELETE /api/js/jobs/saved/:id
// @access  Private (Job Seeker)
export const unsaveJob = asyncHandler(async (req, res) => {
  const savedJob = await SavedJob.findOneAndDelete({
    _id: req.params.id,
    jobSeeker: req.user._id,
  });

  if (!savedJob) {
    return sendError(res, "Saved job not found", 404);
  }

  return sendSuccess(res, null, "Job removed from saved list");
});

export default {
  searchJobs,
  getJobDetail,
  getRecommendedJobs,
  applyForJob,
  getMyApplications,
  getApplicationDetail,
  cancelApplication,
  saveJob,
  getSavedJobs,
  unsaveJob,
};
