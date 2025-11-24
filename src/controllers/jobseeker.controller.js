import User from "../models/User.js";
import Job from "../models/Job.js";
import Company from "../models/Company.js";
import Application from "../models/Application.js";
import SavedJob from "../models/SavedJob.js";
import FollowCompany from "../models/FollowCompany.js";
import Notification from "../models/Notification.js";
import JobAlert from "../models/JobAlert.js";
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

// ============= PROFILE MANAGEMENT =============

// @desc    Get my full profile
// @route   GET /api/js/profile
// @access  Private (Job Seeker)
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    return sendError(res, "User not found", 404);
  }

  return sendSuccess(res, {
    general: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      location: user.location,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      dateJoinedWorkforce: user.dateJoinedWorkforce,
      avatarUrl: user.avatarUrl,
    },
    summary: user.summary,
    experiences: user.experiences,
    education: user.education,
    skills: user.skills,
    certificates: user.certificates,
    awards: user.awards,
    others: user.others,
    resumes: user.resumes,
    interests: user.interests,
    settings: user.settings,
  });
});

// @desc    Update basic info (general)
// @route   PATCH /api/js/profile/general
// @access  Private (Job Seeker)
export const updateBasicInfo = asyncHandler(async (req, res) => {
  const allowedFields = [
    "firstName",
    "lastName",
    "phone",
    "location",
    "dateOfBirth",
    "gender",
    "dateJoinedWorkforce",
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // Handle avatar upload
  if (req.file) {
    const result = await uploadToCloudinary(req.file, "jobmatch/avatars");
    updates.avatarUrl = result.url;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  return sendSuccess(res, user, "General info updated");
});

// @desc    Update summary (About Me)
// @route   PUT /api/js/profile/summary
// @access  Private (Job Seeker)
export const updateSummary = asyncHandler(async (req, res) => {
  const { summary } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { summary },
    { new: true }
  ).select("-password");

  return sendSuccess(res, { summary: user.summary }, "Summary updated");
});

// @desc    Update skills
// @route   PUT /api/js/profile/skills
// @access  Private (Job Seeker)
export const updateSkills = asyncHandler(async (req, res) => {
  const { skills } = req.body;

  if (!Array.isArray(skills)) {
    return sendError(res, "Skills must be an array", 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { skills },
    { new: true }
  ).select("-password");

  return sendSuccess(res, { skills: user.skills }, "Skills updated");
});

// @desc    Update job interests and preferences
// @route   PUT /api/js/profile/interests
// @access  Private (Job Seeker)
export const updateInterests = asyncHandler(async (req, res) => {
  const {
    desiredJobTitles,
    desiredLocations,
    desiredSalaryRange,
    desiredJobTypes,
  } = req.body;

  const interests = {};
  if (desiredJobTitles) interests.desiredJobTitles = desiredJobTitles;
  if (desiredLocations) interests.desiredLocations = desiredLocations;
  if (desiredSalaryRange) interests.desiredSalaryRange = desiredSalaryRange;
  if (desiredJobTypes) interests.desiredJobTypes = desiredJobTypes;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { interests },
    { new: true }
  ).select("-password");

  return sendSuccess(
    res,
    { interests: user.interests },
    "Job interests updated"
  );
});

// ============= EXPERIENCE =============

// @desc    Add work experience
// @route   POST /api/js/profile/experiences
// @access  Private (Job Seeker)
export const addExperience = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.experiences.push(req.body);
  await user.save();

  const newExperience = user.experiences[user.experiences.length - 1];
  return sendSuccess(res, newExperience, "Experience added", 201);
});

// @desc    Update work experience
// @route   PUT /api/js/profile/experiences/:id
// @access  Private (Job Seeker)
export const updateExperience = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const experience = user.experiences.id(req.params.id);

  if (!experience) {
    return sendError(res, "Experience not found", 404);
  }

  Object.assign(experience, req.body);
  await user.save();

  return sendSuccess(res, experience, "Experience updated");
});

// @desc    Delete work experience
// @route   DELETE /api/js/profile/experiences/:id
// @access  Private (Job Seeker)
export const deleteExperience = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.experiences.pull(req.params.id);
  await user.save();

  return sendSuccess(res, null, "Experience deleted");
});

// ============= EDUCATION =============

// @desc    Add education
// @route   POST /api/js/profile/education
// @access  Private (Job Seeker)
export const addEducation = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.education.push(req.body);
  await user.save();

  const newEducation = user.education[user.education.length - 1];
  return sendSuccess(res, newEducation, "Education added", 201);
});

// @desc    Update education
// @route   PUT /api/js/profile/education/:id
// @access  Private (Job Seeker)
export const updateEducation = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const education = user.education.id(req.params.id);

  if (!education) {
    return sendError(res, "Education not found", 404);
  }

  Object.assign(education, req.body);
  await user.save();

  return sendSuccess(res, education, "Education updated");
});

// @desc    Delete education
// @route   DELETE /api/js/profile/education/:id
// @access  Private (Job Seeker)
export const deleteEducation = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.education.pull(req.params.id);
  await user.save();

  return sendSuccess(res, null, "Education deleted");
});

// ============= CERTIFICATES =============

// @desc    Add certificate
// @route   POST /api/js/profile/certificates
// @access  Private (Job Seeker)
export const addCertificate = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.certificates.push(req.body);
  await user.save();

  const newCertificate = user.certificates[user.certificates.length - 1];
  return sendSuccess(res, newCertificate, "Certificate added", 201);
});

// @desc    Update certificate
// @route   PUT /api/js/profile/certificates/:id
// @access  Private (Job Seeker)
export const updateCertificate = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const certificate = user.certificates.id(req.params.id);

  if (!certificate) {
    return sendError(res, "Certificate not found", 404);
  }

  Object.assign(certificate, req.body);
  await user.save();

  return sendSuccess(res, certificate, "Certificate updated");
});

// @desc    Delete certificate
// @route   DELETE /api/js/profile/certificates/:id
// @access  Private (Job Seeker)
export const deleteCertificate = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.certificates.pull(req.params.id);
  await user.save();

  return sendSuccess(res, null, "Certificate deleted");
});

// ============= AWARDS =============

// @desc    Add award
// @route   POST /api/js/profile/awards
// @access  Private (Job Seeker)
export const addAward = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.awards.push(req.body);
  await user.save();

  const newAward = user.awards[user.awards.length - 1];
  return sendSuccess(res, newAward, "Award added", 201);
});

// @desc    Update award
// @route   PUT /api/js/profile/awards/:id
// @access  Private (Job Seeker)
export const updateAward = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const award = user.awards.id(req.params.id);

  if (!award) {
    return sendError(res, "Award not found", 404);
  }

  Object.assign(award, req.body);
  await user.save();

  return sendSuccess(res, award, "Award updated");
});

// @desc    Delete award
// @route   DELETE /api/js/profile/awards/:id
// @access  Private (Job Seeker)
export const deleteAward = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.awards.pull(req.params.id);
  await user.save();

  return sendSuccess(res, null, "Award deleted");
});

// ============= OTHERS (Volunteering, etc.) =============

// @desc    Add other experience
// @route   POST /api/js/profile/others
// @access  Private (Job Seeker)
export const addOther = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.others.push(req.body);
  await user.save();

  const newOther = user.others[user.others.length - 1];
  return sendSuccess(res, newOther, "Other experience added", 201);
});

// @desc    Update other experience
// @route   PUT /api/js/profile/others/:id
// @access  Private (Job Seeker)
export const updateOther = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const other = user.others.id(req.params.id);

  if (!other) {
    return sendError(res, "Other experience not found", 404);
  }

  Object.assign(other, req.body);
  await user.save();

  return sendSuccess(res, other, "Other experience updated");
});

// @desc    Delete other experience
// @route   DELETE /api/js/profile/others/:id
// @access  Private (Job Seeker)
export const deleteOther = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.others.pull(req.params.id);
  await user.save();

  return sendSuccess(res, null, "Other experience deleted");
});

// ============= RESUME =============

// @desc    Upload resume
// @route   POST /api/js/profile/resume
// @access  Private (Job Seeker)
export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, "Please upload a resume file", 400);
  }

  const result = await uploadToCloudinary(req.file, "jobmatch/resumes");

  const user = await User.findById(req.user._id);
  user.resumes.push({
    name: req.file.originalname,
    url: result.url,
  });
  await user.save();

  const newResume = user.resumes[user.resumes.length - 1];
  return sendSuccess(res, newResume, "Resume uploaded", 201);
});

// @desc    Get resumes
// @route   GET /api/js/profile/resume
// @access  Private (Job Seeker)
export const getResumes = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("resumes");
  return sendSuccess(res, user.resumes);
});

// @desc    Update resume
// @route   PUT /api/js/profile/resume/:id
// @access  Private (Job Seeker)
export const updateResume = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const resume = user.resumes.id(req.params.id);

  if (!resume) {
    return sendError(res, "Resume not found", 404);
  }

  if (req.file) {
    const result = await uploadToCloudinary(req.file, "jobmatch/resumes");
    resume.url = result.url;
    resume.name = req.file.originalname;
    resume.uploadedAt = new Date();
  }

  await user.save();
  return sendSuccess(res, resume, "Resume updated");
});

// @desc    Delete resume
// @route   DELETE /api/js/profile/resume/:id
// @access  Private (Job Seeker)
export const deleteResume = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.resumes.pull(req.params.id);
  await user.save();

  return sendSuccess(res, null, "Resume deleted");
});

export default {
  getMyProfile,
  updateBasicInfo,
  updateSummary,
  updateSkills,
  updateInterests,
  addExperience,
  updateExperience,
  deleteExperience,
  addEducation,
  updateEducation,
  deleteEducation,
  addCertificate,
  updateCertificate,
  deleteCertificate,
  addAward,
  updateAward,
  deleteAward,
  addOther,
  updateOther,
  deleteOther,
  uploadResume,
  getResumes,
  updateResume,
  deleteResume,
};
