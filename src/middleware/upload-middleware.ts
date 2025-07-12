// src/middleware/upload-middleware.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import { UPLOAD_PATH, MAX_FILE_SIZE } from "../configs/env";

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), UPLOAD_PATH);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Profile pictures subdirectory
const profilePicsDir = path.join(uploadDir, "profile-pictures");
if (!fs.existsSync(profilePicsDir)) {
  fs.mkdirSync(profilePicsDir, { recursive: true });
}

// Storage configuration for profile pictures
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilePicsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for images only
const imageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  if (file.mimetype.startsWith("image/")) {
    // Additional check for allowed image types
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"));
    }
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

// Multer configuration for profile pictures
export const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  limits: {
    fileSize: MAX_FILE_SIZE, // 5MB
    files: 1 // Only one file at a time
  },
  fileFilter: imageFileFilter
});

// Error handling middleware for multer
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: `File size too large. Maximum size is ${MAX_FILE_SIZE / 1000000}MB`
      });
    } else if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Only one file is allowed."
      });
    } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field. Use 'profilePicture' field name."
      });
    }
  } else if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  return res.status(500).json({
    success: false,
    message: "File upload failed"
  });
};

// Utility function to delete old profile picture
export const deleteOldProfilePicture = (filename: string): void => {
  if (!filename) return;
  
  const filePath = path.join(profilePicsDir, filename);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Error deleting old profile picture:", err);
    }
  });
};

// Generate file URL
export const generateFileUrl = (filename: string): string => {
  return `/uploads/profile-pictures/${filename}`;
};
