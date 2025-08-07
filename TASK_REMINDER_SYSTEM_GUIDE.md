# 🔔 Task Reminder System - Complete Guide

## 🎯 **System Overview**

The Task Reminder System provides automated push notifications to remind users about their tasks at optimal times throughout the day. The system includes:

- **🌅 Morning Reminders (8 AM)**: Start the day with task priorities
- **🌆 Evening Reminders (5 PM)**: End-of-day task check-in
- **🚨 Overdue Notifications**: Real-time alerts for missed deadlines

## ⏰ **Reminder Schedule**

### **Morning Reminders (8:00 AM)**
- **Trigger**: Daily at 8:00 AM
- **Recipients**: Users with incomplete tasks due today or overdue
- **Content**: "Good Morning! You have X tasks due today. Start your day right!"
- **Frequency**: Once per day per user

### **Evening Reminders (5:00 PM)**
- **Trigger**: Daily at 5:00 PM
- **Recipients**: Users with any incomplete tasks
- **Content**: "Evening Task Check-in: Don't forget about [Task Name] - due in X days"
- **Frequency**: Once per day per user

### **Overdue Notifications**
- **Trigger**: Every hour
- **Recipients**: Users with overdue tasks
- **Content**: "Task Overdue! [Task Name] is overdue by X days"
- **Frequency**: Once per day per overdue task

## 🚀 **Features**

### **Smart Notification Logic**
- ✅ **Duplicate Prevention**: Prevents multiple notifications for the same task/user/day
- ✅ **Multi-Channel Delivery**: Push notifications, WhatsApp, and Email
- ✅ **User-Specific Targeting**: Only sends to task creators and assigned users
- ✅ **Priority-Based Selection**: Focuses on most urgent tasks first
- ✅ **Time Zone Awareness**: Respects user's local time

### **Notification Channels**
1. **Push Notifications** (Primary)
   - Real-time delivery
   - Works even when app is closed
   - Rich content with task details

2. **WhatsApp Messages** (Secondary)
   - Direct messaging
   - Rich formatting
   - Reliable delivery

3. **Email Notifications** (Tertiary)
   - Detailed information
   - Professional format
   - Backup delivery method

## 📋 **API Endpoints**

### **Scheduler Management**
```bash
# Get scheduler status
GET /api/task-reminders/status

# Initialize scheduler
POST /api/task-reminders/initialize

# Get user's task reminders
GET /api/task-reminders/user-reminders
```

### **Testing Endpoints**
```bash
# Test morning reminder
POST /api/task-reminders/trigger/morning

# Test evening reminder
POST /api/task-reminders/trigger/evening

# Test overdue check
POST /api/task-reminders/trigger/overdue

# Test specific notification type
POST /api/task-reminders/test-notification
{
  "type": "morning" | "evening" | "overdue"
}
```

## 🛠️ **Setup Instructions**

### **Step 1: Environment Variables**
Ensure these are set in your `.env` file:

```env
# Firebase Configuration (for push notifications)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="your_private_key"
FIREBASE_CLIENT_EMAIL=your_service_account_email

# WhatsApp Configuration (optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### **Step 2: Initialize the System**
The system automatically initializes when the server starts. You can also manually initialize:

```bash
curl -X POST http://localhost:3000/api/task-reminders/initialize \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Step 3: Test the System**
```bash
# Test morning reminders
curl -X POST http://localhost:3000/api/task-reminders/trigger/morning \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test evening reminders
curl -X POST http://localhost:3000/api/task-reminders/trigger/evening \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test overdue notifications
curl -X POST http://localhost:3000/api/task-reminders/trigger/overdue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📱 **Frontend Integration**

### **Check Scheduler Status**
```typescript
const checkSchedulerStatus = async () => {
  const response = await fetch('/api/task-reminders/status', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  console.log('Scheduler Status:', data);
};
```

### **Get User Reminders**
```typescript
const getUserReminders = async () => {
  const response = await fetch('/api/task-reminders/user-reminders', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  console.log('User Reminders:', data);
};
```

### **Test Notifications**
```typescript
const testNotification = async (type: 'morning' | 'evening' | 'overdue') => {
  const response = await fetch('/api/task-reminders/test-notification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ type })
  });
  const data = await response.json();
  console.log('Test Result:', data);
};
```

## 🔍 **Monitoring & Debugging**

### **Console Logs**
The system provides detailed logging:

```
🕐 Initializing Task Reminder Scheduler...
📅 Morning reminders scheduled for 8/15/2024, 8:00:00 AM
📅 Evening reminders scheduled for 8/15/2024, 5:00:00 PM
📅 Overdue task check scheduled (every hour)
✅ Task Reminder Scheduler initialized

🌅 Sending morning reminders (8 AM)...
✅ Morning reminder sent to user@example.com for 3 tasks
🌅 Morning reminders completed: 5 sent, 0 errors

🌆 Sending evening reminders (5 PM)...
✅ Evening reminder sent to user@example.com for 2 tasks
🌆 Evening reminders completed: 3 sent, 0 errors

🔍 Checking for overdue tasks...
✅ Overdue notification sent to task creator for task 507f1f77bcf86cd799439011
🔍 Overdue notifications completed: 2 sent, 1 skipped
```

### **Status Check**
```bash
curl -X GET http://localhost:3000/api/task-reminders/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "active": true,
    "notificationRecords": 15,
    "nextMorningReminder": "8/16/2024, 8:00:00 AM",
    "nextEveningReminder": "8/15/2024, 5:00:00 PM",
    "overdueCheckInterval": "Every hour"
  },
  "message": "Scheduler status retrieved successfully"
}
```

## 🎯 **Notification Examples**

### **Morning Reminder**
```
🌅 Good Morning! Task Reminder
You have a task due today to complete "Complete project proposal". Start your day right!
```

### **Evening Reminder**
```
🌆 Evening Task Check-in
Don't forget about "Review code changes" - due in 2 days.
```

### **Overdue Notification**
```
🚨 Task Overdue!
"Submit monthly report" is overdue by 3 days. Please complete it as soon as possible!
```

## ⚙️ **Configuration Options**

### **Customize Reminder Times**
Edit the scheduler in `src/services/task-reminder-scheduler.ts`:

```typescript
// Morning reminder time (default: 8 AM)
morningTime.setHours(8, 0, 0, 0);

// Evening reminder time (default: 5 PM)
eveningTime.setHours(17, 0, 0, 0);

// Overdue check interval (default: 1 hour)
setTimeout(checkOverdue, 60 * 60 * 1000);
```

### **Customize Notification Messages**
Modify the message templates in the `sendTaskReminder` method:

```typescript
switch (reminderType) {
  case 'morning':
    title = '🌅 Good Morning! Task Reminder';
    message = `You have ${daysUntilDue === 0 ? 'a task due today' : daysUntilDue < 0 ? 'overdue tasks' : `${daysUntilDue} days`} to complete "${task.title}". Start your day right!`;
    break;
  // ... customize other cases
}
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **No notifications being sent**
   - Check if users have device tokens registered
   - Verify Firebase configuration
   - Check scheduler status

2. **Duplicate notifications**
   - System prevents duplicates automatically
   - Check notification records in scheduler

3. **Wrong timing**
   - Verify server timezone
   - Check scheduler initialization logs

4. **Missing channels**
   - Ensure all notification services are configured
   - Check service availability

### **Debug Commands**
```bash
# Check scheduler status
GET /api/task-reminders/status

# Manually trigger reminders
POST /api/task-reminders/trigger/morning
POST /api/task-reminders/trigger/evening
POST /api/task-reminders/trigger/overdue

# Test specific notification
POST /api/task-reminders/test-notification
```

## 📊 **Performance & Scalability**

### **Optimizations**
- ✅ **Efficient Queries**: Uses indexed database queries
- ✅ **Memory Management**: Cleans up old notification records
- ✅ **Rate Limiting**: Prevents notification spam
- ✅ **Error Handling**: Graceful failure recovery

### **Monitoring**
- Track notification delivery rates
- Monitor system performance
- Log user engagement metrics

## 🔐 **Security Considerations**

- ✅ **Authentication Required**: All endpoints require valid JWT tokens
- ✅ **User Isolation**: Users only receive notifications for their tasks
- ✅ **Rate Limiting**: Prevents abuse of testing endpoints
- ✅ **Secure Configuration**: Environment variables for sensitive data

## 📈 **Future Enhancements**

- [ ] **User Preferences**: Allow users to customize reminder times
- [ ] **Smart Scheduling**: AI-powered optimal reminder timing
- [ ] **Notification History**: Track and display past notifications
- [ ] **Bulk Operations**: Send notifications to multiple users
- [ ] **Analytics Dashboard**: Monitor notification effectiveness

---

## 🎉 **Quick Start Checklist**

- [ ] Environment variables configured
- [ ] Firebase service account uploaded
- [ ] Server started and scheduler initialized
- [ ] Test notifications sent successfully
- [ ] User device tokens registered
- [ ] Tasks created with due dates
- [ ] Monitor console logs for scheduler activity

The Task Reminder System is now ready to keep your users on track with their tasks! 🚀 