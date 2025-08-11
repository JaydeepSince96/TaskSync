// src/middleware/validation-middleware.ts
import { body, param, query, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

// Handle validation errors
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array()
    });
    return;
  }
  next();
};

// Auth validation rules
export const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
];

export const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

export const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("New password must contain at least one uppercase letter, one lowercase letter, and one number"),
];

// OTP validation rules
export const sendOTPValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),

  body("invitationToken")
    .optional()
    .isString()
    .withMessage("Invitation token must be a valid string"),
];

export const verifyOTPValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  
  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .matches(/^\d{6}$/)
    .withMessage("OTP must contain only numbers"),
];

export const resendOTPValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
];

// Task validation rules
export const createTaskValidation = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Task title must be between 1 and 200 characters"),
  
  body("label")
    .optional()
    .isIn(["low priority", "medium priority", "high priority"])
    .withMessage("Label must be one of: low priority, medium priority, high priority"),
  
  body("startDate")
    .matches(/^\d{2}\/\d{2}\/\d{4}$/)
    .withMessage("Start date must be in DD/MM/YYYY format")
    .custom((value) => {
      const [day, month, year] = value.split('/');
      const date = new Date(year, month - 1, day);
      if (date.getDate() != day || date.getMonth() != month - 1 || date.getFullYear() != year) {
        throw new Error("Start date must be a valid date");
      }
      return true;
    }),
  
  body("dueDate")
    .matches(/^\d{2}\/\d{2}\/\d{4}$/)
    .withMessage("Due date must be in DD/MM/YYYY format")
    .custom((value, { req }) => {
      // Validate date format
      const [day, month, year] = value.split('/');
      const date = new Date(year, month - 1, day);
      if (date.getDate() != day || date.getMonth() != month - 1 || date.getFullYear() != year) {
        throw new Error("Due date must be a valid date");
      }
      
      // Check if due date is on or after start date (allow same day)
      const [startDay, startMonth, startYear] = req.body.startDate.split('/');
      const startDate = new Date(startYear, startMonth - 1, startDay);
      if (date < startDate) {
        throw new Error("Due date cannot be before start date");
      }
      return true;
    }),
];

export const updateTaskValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid task ID"),
  
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Task title must be between 1 and 200 characters"),
  
  body("label")
    .optional()
    .isIn(["low priority", "medium priority", "high priority"])
    .withMessage("Label must be one of: low priority, medium priority, high priority"),
  
  body("completed")
    .optional()
    .isBoolean()
    .withMessage("Completed must be a boolean value"),
  
  body("startDate")
    .optional()
    .matches(/^\d{2}\/\d{2}\/\d{4}$/)
    .withMessage("Start date must be in DD/MM/YYYY format")
    .custom((value) => {
      if (value) {
        const [day, month, year] = value.split('/');
        const date = new Date(year, month - 1, day);
        if (date.getDate() != day || date.getMonth() != month - 1 || date.getFullYear() != year) {
          throw new Error("Start date must be a valid date");
        }
      }
      return true;
    }),
  
  body("dueDate")
    .optional()
    .matches(/^\d{2}\/\d{2}\/\d{4}$/)
    .withMessage("Due date must be in DD/MM/YYYY format")
    .custom((value, { req }) => {
      if (value) {
        const [day, month, year] = value.split('/');
        const date = new Date(year, month - 1, day);
        if (date.getDate() != day || date.getMonth() != month - 1 || date.getFullYear() != year) {
          throw new Error("Due date must be a valid date");
        }
        
        // If both startDate and dueDate are provided, validate they are compatible
        if (req.body.startDate) {
          const [startDay, startMonth, startYear] = req.body.startDate.split('/');
          const startDate = new Date(startYear, startMonth - 1, startDay);
          if (date < startDate) {
            throw new Error("Due date cannot be before start date");
          }
        }
      }
      return true;
    }),
];

// Subtask validation rules
export const createSubtaskValidation = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Subtask title must be between 1 and 500 characters"),
  
  body("taskId")
    .isMongoId()
    .withMessage("Invalid task ID"),
  
  body("startDate")
    .optional()
    .matches(/^\d{2}\/\d{2}\/\d{4}$/)
    .withMessage("Start date must be in DD/MM/YYYY format")
    .custom((value) => {
      if (value) {
        const [day, month, year] = value.split('/');
        const date = new Date(year, month - 1, day);
        if (date.getDate() != day || date.getMonth() != month - 1 || date.getFullYear() != year) {
          throw new Error("Start date must be a valid date");
        }
      }
      return true;
    }),
  
  body("endDate")
    .optional()
    .matches(/^\d{2}\/\d{2}\/\d{4}$/)
    .withMessage("End date must be in DD/MM/YYYY format")
    .custom((value) => {
      if (value) {
        const [day, month, year] = value.split('/');
        const date = new Date(year, month - 1, day);
        if (date.getDate() != day || date.getMonth() != month - 1 || date.getFullYear() != year) {
          throw new Error("End date must be a valid date");
        }
      }
      return true;
    }),
];

export const updateSubtaskValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid subtask ID"),
  
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Subtask title must be between 1 and 500 characters"),
  
  body("completed")
    .optional()
    .isBoolean()
    .withMessage("Completed must be a boolean value"),
  
  body("startDate")
    .optional()
    .matches(/^\d{2}\/\d{2}\/\d{4}$/)
    .withMessage("Start date must be in DD/MM/YYYY format")
    .custom((value) => {
      if (value) {
        const [day, month, year] = value.split('/');
        const date = new Date(year, month - 1, day);
        if (date.getDate() != day || date.getMonth() != month - 1 || date.getFullYear() != year) {
          throw new Error("Start date must be a valid date");
        }
      }
      return true;
    }),
  
  body("endDate")
    .optional()
    .matches(/^\d{2}\/\d{2}\/\d{4}$/)
    .withMessage("End date must be in DD/MM/YYYY format")
    .custom((value) => {
      if (value) {
        const [day, month, year] = value.split('/');
        const date = new Date(year, month - 1, day);
        if (date.getDate() != day || date.getMonth() != month - 1 || date.getFullYear() != year) {
          throw new Error("End date must be a valid date");
        }
      }
      return true;
    }),
];

// General validation rules
export const mongoIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid ID format"),
];

export const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];
