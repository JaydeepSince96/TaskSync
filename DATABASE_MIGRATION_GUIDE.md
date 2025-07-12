# Database Migration Guide

This guide explains how to migrate your existing TaskSync database to support the new user authentication system.

## Overview

The authentication system introduces user-specific data isolation, which means all tasks and subtasks need to be associated with a user. This migration will:

1. Add `userId` field to existing tasks and subtasks
2. Create a default user for orphaned data
3. Update database indexes for optimal performance
4. Provide rollback capabilities

## Prerequisites

- Ensure your MongoDB database is running
- Create a backup of your database before running migrations
- Stop your application before running migrations

## Migration Steps

### 1. Backup Your Database (Recommended)

```bash
# Create a backup of your database
mongodump --db todo-app --out ./backup/$(date +%Y%m%d_%H%M%S)
```

### 2. Run All Migrations

```bash
# Run all migrations in sequence
npm run migrate
```

This will execute all migrations:
- ✅ Add userId to existing tasks
- ✅ Add userId to existing subtasks  
- ✅ Create default user for orphaned data
- ✅ Update task database indexes
- ✅ Update subtask database indexes

### 3. Run Specific Migrations (Optional)

You can run individual migrations if needed:

```bash
# Run specific migration
npm run migrate run tasks          # Add userId to tasks
npm run migrate run subtasks       # Add userId to subtasks
npm run migrate run default-user   # Create default user
npm run migrate run task-indexes   # Update task indexes
npm run migrate run subtask-indexes # Update subtask indexes
```

### 4. Verify Migration Results

After migration, verify your data:

```bash
# Connect to your MongoDB
mongosh todo-app

# Check tasks have userId
db.tasks.find({}, {title: 1, userId: 1}).limit(5)

# Check subtasks have userId
db.subtasks.find({}, {title: 1, userId: 1}).limit(5)

# Check default user was created
db.users.findOne({email: "default@tasksync.com"})

# Check indexes
db.tasks.getIndexes()
db.subtasks.getIndexes()
```

## Default User

The migration creates a default user for all existing data:

```json
{
  "name": "Default User",
  "email": "default@tasksync.com",
  "password": "temp123456", // Change this after migration!
  "isEmailVerified": true
}
```

**⚠️ Important**: Change the default user's password after migration:

1. Login with email: `default@tasksync.com` and password: `temp123456`
2. Go to profile settings and change the password
3. Update the name and email if needed

## Database Schema Changes

### Tasks Collection

**Before:**
```json
{
  "_id": "...",
  "title": "Task title",
  "status": "pending",
  "priority": "high",
  "createdAt": "...",
  "dueDate": "..."
}
```

**After:**
```json
{
  "_id": "...",
  "userId": "ObjectId(user_id)", // NEW FIELD
  "title": "Task title",
  "status": "pending",
  "priority": "high", 
  "createdAt": "...",
  "dueDate": "..."
}
```

### Subtasks Collection

**Before:**
```json
{
  "_id": "...",
  "taskId": "...",
  "title": "Subtask title",
  "completed": false,
  "createdAt": "..."
}
```

**After:**
```json
{
  "_id": "...",
  "userId": "ObjectId(user_id)", // NEW FIELD
  "taskId": "...",
  "title": "Subtask title", 
  "completed": false,
  "createdAt": "..."
}
```

### New Indexes

**Task Indexes:**
- `{ userId: 1, status: 1 }` - For filtering tasks by user and status
- `{ userId: 1, priority: 1 }` - For filtering tasks by user and priority
- `{ userId: 1, dueDate: 1 }` - For sorting tasks by due date per user
- `{ userId: 1, createdAt: -1 }` - For sorting tasks by creation date per user

**Subtask Indexes:**
- `{ userId: 1, taskId: 1 }` - For finding subtasks by user and task
- `{ userId: 1, completed: 1 }` - For filtering subtasks by completion status
- `{ userId: 1, createdAt: -1 }` - For sorting subtasks by creation date per user

## Rollback (If Needed)

If you need to rollback the migration:

```bash
# Rollback all userId migrations
npm run migrate rollback
```

This will:
- Remove `userId` field from all tasks
- Remove `userId` field from all subtasks  
- Delete the default user
- Note: Indexes are not automatically rolled back

## Manual Rollback Steps

If you need to manually rollback:

```javascript
// Connect to MongoDB
mongosh todo-app

// Remove userId from tasks
db.tasks.updateMany({}, {$unset: {userId: 1}})

// Remove userId from subtasks  
db.subtasks.updateMany({}, {$unset: {userId: 1}})

// Remove default user
db.users.deleteOne({email: "default@tasksync.com"})
```

## Post-Migration Steps

1. **Test your application** with the new authentication system
2. **Change default user password** if you plan to use it
3. **Create new user accounts** for your actual users
4. **Transfer data ownership** if needed (assign tasks to specific users)

## Troubleshooting

### Migration Fails

1. Check MongoDB connection
2. Ensure sufficient permissions
3. Check database space
4. Review error logs

### Data Inconsistency

1. Run individual migrations to identify the issue
2. Check migration logs for specific errors
3. Verify database schema manually

### Performance Issues

1. Check if indexes were created properly
2. Run `db.collection.getIndexes()` to verify
3. Consider adding additional indexes based on your query patterns

## Environment Variables

Add these to your `.env` file for Google OAuth:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend URL for OAuth redirects
FRONTEND_URL=http://localhost:3000
```

## Migration Log Example

```
🚀 Starting database migrations...
✅ Add userId to existing tasks: Successfully added userId to existing tasks
   📊 Affected documents: 15
✅ Add userId to existing subtasks: Successfully added userId to existing subtasks  
   📊 Affected documents: 23
✅ Create default user for orphaned data: Default user already exists
   📊 Affected documents: 0
✅ Update task indexes: Successfully updated task indexes with userId
   📊 Affected documents: 4
✅ Update subtask indexes: Successfully updated subtask indexes with userId
   📊 Affected documents: 3
🎉 All migrations completed!
```

## Next Steps

After successful migration:

1. Update your frontend to use the new authentication system
2. Test user registration and login
3. Test Google OAuth integration  
4. Verify user data isolation works correctly
5. Update your API documentation

For frontend integration examples, see `FRONTEND_AUTH_INTEGRATION.md`.
