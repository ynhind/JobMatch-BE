import express from "express";
import {
  createCompanyProfile,
  getMyCompanyProfile,
  updateCompanyProfile,
  postJob,
  getMyJobs,
  getJobById,
  updateJob,
  updateJobStatus,
  deleteJob,
  getJobApplicants,
  updateApplicationStatus,
  getEmployerStats,
} from "../controllers/employer.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { uploadSingle } from "../middleware/upload.middleware.js";
import {
  createCompanyValidation,
  createJobValidation,
  updateJobStatusValidation,
  idParamValidation,
  paginationValidation,
  validate,
} from "../middleware/validation.middleware.js";

const router = express.Router();

// All routes are protected and for employers only
router.use(protect);
router.use(authorize("employer"));

// ============= COMPANY PROFILE =============
router
  .route("/profile")
  .post(
    uploadSingle("logo"),
    createCompanyValidation,
    validate,
    createCompanyProfile
  )
  .get(getMyCompanyProfile)
  .put(uploadSingle("logo"), updateCompanyProfile);

// ============= JOBS MANAGEMENT =============
router
  .route("/jobs")
  .post(createJobValidation, validate, postJob)
  .get(paginationValidation, validate, getMyJobs);

router
  .route("/jobs/:id")
  .get(idParamValidation, validate, getJobById)
  .put(idParamValidation, validate, updateJob)
  .patch(
    idParamValidation,
    updateJobStatusValidation,
    validate,
    updateJobStatus
  )
  .delete(idParamValidation, validate, deleteJob);

// ============= APPLICANTS =============
router.get(
  "/jobs/:id/applicants",
  idParamValidation,
  paginationValidation,
  validate,
  getJobApplicants
);
router.patch(
  "/applications/:id/status",
  idParamValidation,
  validate,
  updateApplicationStatus
);

// ============= STATS =============
router.get("/stats", getEmployerStats);

export default router;
