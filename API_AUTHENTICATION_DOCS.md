# TaskSync Authentication API Documentation

## Overview
This API provides a complete authentication system with JWT tokens, Google OAuth, profile management, and user-specific task management.

## Base URL
```
http://localhost:3001/api
```

## Authentication Headers
For protected routes, include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

Register a new user with email and password.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "userId",
      "name": "John Doe",
      "email": "john@example.com",
      "isEmailVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### 2. Login User
**POST** `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "userId",
      "name": "John Doe",
      "email": "john@example.com",
      "profilePicture": "/uploads/profile-pictures/image.jpg",
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### 3. Refresh Token
**POST** `/auth/refresh-token`

Get a new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-jwt-access-token",
    "refreshToken": "new-jwt-refresh-token"
  }
}
```

### 4. Logout User
**POST** `/auth/logout` 🔒

Logout from current device (removes refresh token).

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### 5. Logout All Devices
**POST** `/auth/logout-all` 🔒

Logout from all devices (removes all refresh tokens).

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

---

## Profile Management

### 6. Get Profile
**GET** `/auth/profile` 🔒

Get current user profile information.

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "userId",
      "name": "John Doe",
      "email": "john@example.com",
      "profilePicture": "/uploads/profile-pictures/image.jpg",
      "isEmailVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLogin": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 7. Update Profile
**PUT** `/auth/profile` 🔒

Update user profile information.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "userId",
      "name": "John Smith",
      "email": "johnsmith@example.com",
      "profilePicture": "/uploads/profile-pictures/image.jpg"
    }
  }
}
```

### 8. Upload Profile Picture
**POST** `/auth/upload-profile-picture` 🔒

Upload a new profile picture.

**Request:** Multipart form data with field name `profilePicture`

**Supported formats:** JPEG, PNG, GIF, WebP
**Max file size:** 5MB

**Response (200):**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profilePicture": "/uploads/profile-pictures/1234567890-filename.jpg"
  }
}
```

### 9. Change Password
**PUT** `/auth/change-password` 🔒

Change user password.

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewSecurePass456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again."
}
```

### 10. Delete Account
**DELETE** `/auth/account` 🔒

Delete user account permanently.

**Request Body:**
```json
{
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

## Task Management (User-Specific)

### 11. Get All Tasks
**GET** `/task` 🔒

Get all tasks for the authenticated user.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "taskId",
      "title": "Complete project",
      "completed": false,
      "label": "high priority",
      "startDate": "01-01-24, 09:00",
      "dueDate": "05-01-24, 17:00",
      "userId": "userId",
      "createdAt": "01-01-24, 09:00",
      "updatedAt": "01-01-24, 09:00"
    }
  ]
}
```

### 12. Create Task
**POST** `/task` 🔒

Create a new task for the authenticated user.

**Request Body:**
```json
{
  "title": "New task",
  "label": "medium priority",
  "startDate": "2024-01-01T09:00:00.000Z",
  "dueDate": "2024-01-05T17:00:00.000Z"
}
```

### 13. Get Task by ID
**GET** `/task/:id` 🔒

Get a specific task by ID (user-specific).

### 14. Update Task
**PUT** `/task/:id` 🔒

Update a specific task (user-specific).

### 15. Delete Task
**DELETE** `/task/:id` 🔒

Delete a specific task and all its subtasks (user-specific).

---

## Subtask Management (User-Specific)

### 16. Get Subtasks
**GET** `/subtasks/task/:taskId` 🔒

Get all subtasks for a specific task (user-specific).

### 17. Create Subtask
**POST** `/subtasks` 🔒

Create a new subtask for a task (user-specific).

**Request Body:**
```json
{
  "title": "Subtask title",
  "taskId": "taskId",
  "startDate": "2024-01-01T09:00:00.000Z",
  "endDate": "2024-01-02T17:00:00.000Z"
}
```

### 18. Update Subtask
**PUT** `/subtasks/:id` 🔒

Update a specific subtask (user-specific).

### 19. Delete Subtask
**DELETE** `/subtasks/:id` 🔒

Delete a specific subtask (user-specific).

### 20. Toggle Subtask
**PATCH** `/subtasks/:id/toggle` 🔒

Toggle subtask completion status (user-specific).

---

## Statistics (User-Specific)

### 21. Get Task Statistics
**GET** `/task/stats` 🔒

Get task statistics for the authenticated user.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "completed": 6,
    "pending": 4,
    "overdue": 1,
    "completionRate": 60
  }
}
```

### 22. Get Subtask Statistics
**GET** `/task/stats/subtasks/:taskId` 🔒

Get subtask statistics for a specific task (user-specific).

---

## Error Responses

### 400 - Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Task not found or access denied"
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Security Features

1. **Password Hashing**: Passwords are hashed using bcrypt with 12 salt rounds
2. **JWT Tokens**: Access tokens expire in 15 minutes, refresh tokens in 7 days
3. **Refresh Token Rotation**: New refresh tokens are generated on each refresh
4. **Multi-device Support**: Users can be logged in on multiple devices
5. **User Isolation**: All data is user-specific and properly isolated
6. **File Upload Security**: Profile pictures are validated and stored securely
7. **Input Validation**: All inputs are validated using express-validator
8. **Rate Limiting**: Implement rate limiting for production use

---

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example` and configure your environment variables

3. Start MongoDB locally or use MongoDB Atlas

4. Run the development server:
```bash
npm run dev
```

5. The API will be available at `http://localhost:3001/api`

---

🔒 = Requires Authentication
