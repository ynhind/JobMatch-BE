import multer from "multer";
import path from "path";
import { sendError } from "../utils/helpers.js";

// Configure multer for memory storage (we'll upload to Cloudinary)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    image: /jpeg|jpg|png|gif|webp/,
    document: /pdf|doc|docx/,
  };

  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  // Check for images
  if (mimetype.startsWith("image/") && allowedTypes.image.test(ext)) {
    return cb(null, true);
  }

  // Check for documents (resumes)
  if (
    mimetype.match(
      /pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document/
    ) &&
    allowedTypes.document.test(ext)
  ) {
    return cb(null, true);
  }

  cb(new Error(`File type not supported: ${ext}`), false);
};

// Multer upload configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Middleware for single file upload
export const uploadSingle = (fieldName) => (req, res, next) => {
  const singleUpload = upload.single(fieldName);

  singleUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return sendError(res, "File size too large. Maximum size is 5MB", 400);
      }
      return sendError(res, err.message, 400);
    } else if (err) {
      return sendError(res, err.message, 400);
    }
    next();
  });
};

// Middleware for multiple files upload
export const uploadMultiple =
  (fieldName, maxCount = 5) =>
  (req, res, next) => {
    const multipleUpload = upload.array(fieldName, maxCount);

    multipleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return sendError(
            res,
            "File size too large. Maximum size is 5MB",
            400
          );
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return sendError(res, `Too many files. Maximum is ${maxCount}`, 400);
        }
        return sendError(res, err.message, 400);
      } else if (err) {
        return sendError(res, err.message, 400);
      }
      next();
    });
  };

// Helper to upload to Cloudinary
import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = async (file, folder = "jobmatch") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto", // Automatically detect file type
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    uploadStream.end(file.buffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return false;
  }
};
