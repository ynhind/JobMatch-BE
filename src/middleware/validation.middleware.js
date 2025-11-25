import { body, param, query, validationResult } from "express-validator";
import { sendError } from "../utils/helpers.js";

// Validation result handler
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, "Validation failed", 400, errors.array());
  }
  next();
};

// Auth validations
export const registerValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .isIn(["js", "employer"])
    .withMessage("Role must be either js or employer"),
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
];

export const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Company validations
export const createCompanyValidation = [
  body("companyName").trim().notEmpty().withMessage("Company name is required"),
  body("description").optional().trim(),
  body("address").optional().trim(),
  body("phone").optional().trim(),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email"),
];

// Job validations
export const createJobValidation = [
  body("title").trim().notEmpty().withMessage("Job title is required"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Job description is required"),
  body("requirements").optional().trim(),
  body("jobType")
    .optional()
    .isIn(["fulltime", "parttime", "contract", "internship", "remote"]),
  body("deadline").optional().isISO8601().withMessage("Invalid deadline date"),
];

export const updateJobStatusValidation = [
  body("status")
    .isIn(["open", "closed", "draft"])
    .withMessage("Invalid status"),
];

// Application validations
export const applyJobValidation = [
  body("resumeId").optional().trim(),
  body("coverLetter").optional().trim(),
];

// Profile validations
export const updateBasicInfoValidation = [
  body("firstName").optional().trim(),
  body("lastName").optional().trim(),
  body("phone").optional().trim(),
  body("location").optional().trim(),
  body("dateOfBirth").optional().isISO8601().withMessage("Invalid date"),
  body("gender").optional().isIn(["male", "female", "other"]),
];

export const updateSummaryValidation = [
  body("summary").trim().notEmpty().withMessage("Summary cannot be empty"),
];

// Experience validations
export const addExperienceValidation = [
  body("companyName").trim().notEmpty().withMessage("Company name is required"),
  body("position").trim().notEmpty().withMessage("Position is required"),
  body("startDate").isISO8601().withMessage("Invalid start date"),
  body("endDate").optional().isISO8601().withMessage("Invalid end date"),
  body("isCurrent").optional().isBoolean(),
];

// Education validations
export const addEducationValidation = [
  body("school").trim().notEmpty().withMessage("School name is required"),
  body("degree").trim().notEmpty().withMessage("Degree is required"),
  body("startDate").optional().isISO8601().withMessage("Invalid start date"),
  body("endDate").optional().isISO8601().withMessage("Invalid end date"),
];

// Certificate validations
export const addCertificateValidation = [
  body("name").trim().notEmpty().withMessage("Certificate name is required"),
  body("organization")
    .trim()
    .notEmpty()
    .withMessage("Organization is required"),
  body("issueDate").optional().isISO8601().withMessage("Invalid issue date"),
];

// Award validations
export const addAwardValidation = [
  body("name").trim().notEmpty().withMessage("Award name is required"),
  body("organization").optional().trim(),
  body("issueDate").optional().isISO8601().withMessage("Invalid issue date"),
];

// ID param validation
export const idParamValidation = [
  param("id").isMongoId().withMessage("Invalid ID format"),
];

// Pagination query validation
export const paginationValidation = [
  query("page")
    .optional()
    .custom((value) => {
      const num = parseInt(value, 10);
      return !isNaN(num) && num >= 1;
    })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .custom((value) => {
      const num = parseInt(value, 10);
      return !isNaN(num) && num >= 1 && num <= 100;
    })
    .withMessage("Limit must be between 1 and 100"),
];
