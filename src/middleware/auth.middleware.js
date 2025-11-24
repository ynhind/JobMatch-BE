import User from "../models/User.js";
import Admin from "../models/Admin.js";
import { verifyToken } from "../utils/jwt.utils.js";
import { sendError } from "../utils/helpers.js";

// Protect routes - verify JWT
export const protect = async (req, res, next) => {
  try {
    // Get token from header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return sendError(res, "Not authorized, no token provided", 401);
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return sendError(res, "Not authorized, token invalid or expired", 401);
    }

    // Get user from token
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    if (!user.isActive) {
      return sendError(res, "User account is deactivated", 403);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return sendError(res, "Not authorized", 401);
  }
};

// Admin protect
export const protectAdmin = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return sendError(res, "Not authorized, no token provided", 401);
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return sendError(res, "Not authorized as admin", 403);
    }

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return sendError(res, "Admin not found", 404);
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    return sendError(res, "Not authorized", 401);
  }
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Not authorized", 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Role '${req.user.role}' is not authorized to access this route`,
        403
      );
    }

    next();
  };
};
