// src/services/system-user-service.ts
import { User } from "../models/user-model";
import bcrypt from "bcryptjs";

export class SystemUserService {
  private static SYSTEM_USER_EMAIL = "system@tasksync.org";
  private static SYSTEM_USER_NAME = "TaskSync System";

  /**
   * Get or create the system user for public invitations
   */
  static async getSystemUser() {
    try {
      // Try to find existing system user
      let systemUser = await User.findOne({ email: this.SYSTEM_USER_EMAIL });

      if (!systemUser) {
        // Create system user if it doesn't exist
        const hashedPassword = await bcrypt.hash("system-password-" + Date.now(), 12);
        
        systemUser = new User({
          name: this.SYSTEM_USER_NAME,
          email: this.SYSTEM_USER_EMAIL,
          password: hashedPassword,
          isEmailVerified: true,
          subscriptionStatus: 'active',
          subscriptionPlan: 'monthly',
          preferences: {
            emailNotifications: false,
            pushNotifications: false,
            taskReminders: false,
            weeklyReports: false,
            theme: 'light'
          },
          notificationPreferences: {
            whatsapp: false,
            email: false,
            push: false,
            taskReminders: false,
            weeklyReports: false,
            customMessages: false
          }
        });

        await systemUser.save();
        console.log("✅ System user created for public invitations");
      }

      return systemUser;
    } catch (error) {
      console.error("❌ Error getting system user:", error);
      throw new Error("Failed to get system user for public invitations");
    }
  }

  /**
   * Get system user ID for public invitations
   */
  static async getSystemUserId() {
    const systemUser = await this.getSystemUser();
    return systemUser._id;
  }

  /**
   * Check if a user is the system user
   */
  static isSystemUser(userId: string) {
    return userId === this.SYSTEM_USER_EMAIL;
  }
}
