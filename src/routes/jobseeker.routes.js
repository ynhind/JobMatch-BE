import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { uploadSingle } from "../middleware/upload.middleware.js";
import {
  idParamValidation,
  paginationValidation,
  updateBasicInfoValidation,
  updateSummaryValidation,
  addExperienceValidation,
  addEducationValidation,
  addCertificateValidation,
  addAwardValidation,
  applyJobValidation,
  validate,
} from "../middleware/validation.middleware.js";

// Import profile controllers
import {
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
} from "../controllers/jobseeker.controller.js";

// Import job-related controllers
import {
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
} from "../controllers/jobseeker-jobs.controller.js";

// Import company, notification, settings controllers
import {
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
} from "../controllers/jobseeker-extra.controller.js";

const router = express.Router();

// ============= PROFILE ROUTES (Private - Job Seeker) =============
router.use("/profile", protect, authorize("js"));

router.get("/profile", getMyProfile);
router.patch(
  "/profile/general",
  uploadSingle("avatar"),
  updateBasicInfoValidation,
  validate,
  updateBasicInfo
);
router.put(
  "/profile/summary",
  updateSummaryValidation,
  validate,
  updateSummary
);
router.put("/profile/skills", updateSkills);
router.put("/profile/interests", updateInterests);

// Experience
router.post(
  "/profile/experiences",
  addExperienceValidation,
  validate,
  addExperience
);
router.put(
  "/profile/experiences/:id",
  idParamValidation,
  validate,
  updateExperience
);
router.delete(
  "/profile/experiences/:id",
  idParamValidation,
  validate,
  deleteExperience
);

// Education
router.post(
  "/profile/education",
  addEducationValidation,
  validate,
  addEducation
);
router.put(
  "/profile/education/:id",
  idParamValidation,
  validate,
  updateEducation
);
router.delete(
  "/profile/education/:id",
  idParamValidation,
  validate,
  deleteEducation
);

// Certificates
router.post(
  "/profile/certificates",
  addCertificateValidation,
  validate,
  addCertificate
);
router.put(
  "/profile/certificates/:id",
  idParamValidation,
  validate,
  updateCertificate
);
router.delete(
  "/profile/certificates/:id",
  idParamValidation,
  validate,
  deleteCertificate
);

// Awards
router.post("/profile/awards", addAwardValidation, validate, addAward);
router.put("/profile/awards/:id", idParamValidation, validate, updateAward);
router.delete("/profile/awards/:id", idParamValidation, validate, deleteAward);

// Others
router.post("/profile/others", addOther);
router.put("/profile/others/:id", idParamValidation, validate, updateOther);
router.delete("/profile/others/:id", idParamValidation, validate, deleteOther);

// Resume
router
  .route("/profile/resume")
  .post(protect, authorize("js"), uploadSingle("resume"), uploadResume)
  .get(protect, authorize("js"), getResumes);

router
  .route("/profile/resume/:id")
  .put(
    protect,
    authorize("js"),
    idParamValidation,
    validate,
    uploadSingle("resume"),
    updateResume
  )
  .delete(protect, authorize("js"), idParamValidation, validate, deleteResume);

// ============= JOB ROUTES =============

// Public job routes
router.get("/jobs/search", paginationValidation, validate, searchJobs);
router.get("/jobs/:id", idParamValidation, validate, getJobDetail);

// Protected job routes
router.get(
  "/jobs/recommended",
  protect,
  authorize("js"),
  paginationValidation,
  validate,
  getRecommendedJobs
);

// ============= APPLICATION ROUTES (Private - Job Seeker) =============
router.post(
  "/jobs/:id/apply",
  protect,
  authorize("js"),
  idParamValidation,
  applyJobValidation,
  validate,
  applyForJob
);
router.get(
  "/applications",
  protect,
  authorize("js"),
  paginationValidation,
  validate,
  getMyApplications
);
router.get(
  "/applications/:id",
  protect,
  authorize("js"),
  idParamValidation,
  validate,
  getApplicationDetail
);
router.delete(
  "/applications/:id",
  protect,
  authorize("js"),
  idParamValidation,
  validate,
  cancelApplication
);

// ============= SAVED JOBS (Private - Job Seeker) =============
router.post("/jobs/saved", protect, authorize("js"), saveJob);
router.get(
  "/jobs/saved",
  protect,
  authorize("js"),
  paginationValidation,
  validate,
  getSavedJobs
);
router.delete(
  "/jobs/saved/:id",
  protect,
  authorize("js"),
  idParamValidation,
  validate,
  unsaveJob
);

// ============= COMPANY ROUTES =============

// Public company routes
router.get("/companies", paginationValidation, validate, searchCompanies);
router.get("/companies/:id", idParamValidation, validate, getCompanyDetail);

// Protected company routes
router.post(
  "/companies/:id/follow",
  protect,
  authorize("js"),
  idParamValidation,
  validate,
  followCompany
);
router.delete(
  "/companies/:id/follow",
  protect,
  authorize("js"),
  idParamValidation,
  validate,
  unfollowCompany
);
router.get(
  "/companies/following",
  protect,
  authorize("js"),
  paginationValidation,
  validate,
  getFollowingCompanies
);

// ============= NOTIFICATIONS (Private - Job Seeker) =============
router.get(
  "/notifications",
  protect,
  authorize("js"),
  paginationValidation,
  validate,
  getNotifications
);
router.put(
  "/notifications/:id/read",
  protect,
  authorize("js"),
  idParamValidation,
  validate,
  markNotificationAsRead
);
router.put(
  "/notifications/read-all",
  protect,
  authorize("js"),
  markAllNotificationsAsRead
);

// ============= JOB ALERTS (Private - Job Seeker) =============
router
  .route("/alert")
  .post(protect, authorize("js"), createJobAlert)
  .get(protect, authorize("js"), getJobAlerts);

router
  .route("/alert/:id")
  .put(protect, authorize("js"), idParamValidation, validate, updateJobAlert)
  .delete(
    protect,
    authorize("js"),
    idParamValidation,
    validate,
    deleteJobAlert
  );

router.put(
  "/alert/:id/toggle",
  protect,
  authorize("js"),
  idParamValidation,
  validate,
  toggleJobAlert
);

// ============= SETTINGS (Private - Job Seeker) =============
router
  .route("/settings")
  .get(protect, authorize("js"), getSettings)
  .put(protect, authorize("js"), updateSettings);

router.put("/settings/password", protect, authorize("js"), changePassword);
router.delete("/settings/account", protect, authorize("js"), deleteAccount);

export default router;
