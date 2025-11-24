import express from "express";
import {
  adminLogin,
  getUsers,
  updateUserStatus,
  deleteUser,
  verifyCompany,
  getReports,
  createReport,
  updateReportStatus,
  getAdminStats,
} from "../controllers/admin.controller.js";
import { protect, protectAdmin } from "../middleware/auth.middleware.js";
import {
  loginValidation,
  validate,
  paginationValidation,
} from "../middleware/validation.middleware.js";

const router = express.Router();

// Public routes
router.post("/login", loginValidation, validate, adminLogin);

// Protected admin routes
router.get("/users", protectAdmin, paginationValidation, validate, getUsers);
router.patch("/users/:id/status", protectAdmin, updateUserStatus);
router.delete("/users/:id", protectAdmin, deleteUser);

router.patch("/company/:id/verify", protectAdmin, verifyCompany);

router.get(
  "/reports",
  protectAdmin,
  paginationValidation,
  validate,
  getReports
);
router.patch("/reports/:id", protectAdmin, updateReportStatus);

router.get("/stats", protectAdmin, getAdminStats);

// Report route (available to all authenticated users)
router.post("/reports", protect, createReport);

export default router;
