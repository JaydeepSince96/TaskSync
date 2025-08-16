import { ContactModel } from '../models/contact-model';
import { EmailService } from './email-service';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactSubmissionResult {
  success: boolean;
  message?: string;
  data?: any;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface GetAllSubmissionsParams {
  page: number;
  limit: number;
  status?: string;
}

export class ContactService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async submitContactForm(data: ContactFormData): Promise<ContactSubmissionResult> {
    try {
      // Create contact submission in database
      const contactSubmission = new ContactModel({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        status: 'unread',
        submittedAt: new Date()
      });

      const savedSubmission = await contactSubmission.save();

      // Send email notification to admin
      await this.sendContactNotification(data, savedSubmission._id?.toString() || '');

      // Send confirmation email to user
      await this.sendConfirmationEmail(data.email, data.name);

      return {
        success: true,
        data: savedSubmission
      };
    } catch (error: any) {
      console.error('Contact form submission error:', error);
      return {
        success: false,
        message: 'Failed to submit contact form'
      };
    }
  }

  private async sendContactNotification(data: ContactFormData, submissionId: string): Promise<void> {
    try {
      const subject = `New Contact Form Submission - ${data.subject}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Submission Details</h3>
            <p><strong>Submission ID:</strong> ${submissionId}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #1e293b;">Contact Information</h3>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #2563eb;">${data.email}</a></p>
            <p><strong>Subject:</strong> ${data.subject}</p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #1e293b;">Message</h3>
            <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #2563eb; border-radius: 4px;">
              ${data.message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>Action Required:</strong> Please respond to this inquiry within 24 hours.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px;">
              This is an automated notification from TaskSync Contact Form System.
            </p>
          </div>
        </div>
      `;

      await this.emailService.sendCustomEmail(
        'jaydeep.bhattachary@tasksync.org',
        subject,
        htmlContent
      );

      console.log('Contact notification email sent successfully');
    } catch (error) {
      console.error('Failed to send contact notification email:', error);
    }
  }

  private async sendConfirmationEmail(userEmail: string, userName: string): Promise<void> {
    try {
      const subject = 'Thank you for contacting TaskSync';
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; text-align: center;">
            Thank you for contacting TaskSync!
          </h2>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af;">
              Hi ${userName},
            </p>
            <p style="margin: 10px 0 0 0; color: #1e40af;">
              We've received your message and our team will get back to you within 24 hours.
            </p>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">What happens next?</h3>
            <ul style="color: #475569;">
              <li>Our support team will review your inquiry</li>
              <li>You'll receive a personalized response within 24 hours</li>
              <li>We may follow up with additional questions if needed</li>
            </ul>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>Need immediate assistance?</strong> 
              You can also reach us at <a href="tel:+918887909914" style="color: #92400e;">+91 8887909914</a> during business hours.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px;">
              Best regards,<br>
              The TaskSync Team
            </p>
          </div>
        </div>
      `;

      await this.emailService.sendCustomEmail(
        userEmail,
        subject,
        htmlContent
      );

      console.log('Confirmation email sent successfully to user');
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    }
  }

  async getAllContactSubmissions(params: GetAllSubmissionsParams): Promise<ContactSubmissionResult> {
    try {
      const { page, limit, status } = params;
      const skip = (page - 1) * limit;

      let query: any = {};
      if (status) {
        query.status = status;
      }

      const submissions = await ContactModel.find(query)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await ContactModel.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: submissions,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error: any) {
      console.error('Get contact submissions error:', error);
      return {
        success: false,
        message: 'Failed to fetch contact submissions'
      };
    }
  }

  async markAsRead(submissionId: string): Promise<ContactSubmissionResult> {
    try {
      const submission = await ContactModel.findByIdAndUpdate(
        submissionId,
        { status: 'read' },
        { new: true }
      );

      if (!submission) {
        return {
          success: false,
          message: 'Contact submission not found'
        };
      }

      return {
        success: true,
        data: submission
      };
    } catch (error: any) {
      console.error('Mark as read error:', error);
      return {
        success: false,
        message: 'Failed to mark submission as read'
      };
    }
  }

  async deleteContactSubmission(submissionId: string): Promise<ContactSubmissionResult> {
    try {
      const submission = await ContactModel.findByIdAndDelete(submissionId);

      if (!submission) {
        return {
          success: false,
          message: 'Contact submission not found'
        };
      }

      return {
        success: true,
        data: submission
      };
    } catch (error: any) {
      console.error('Delete contact submission error:', error);
      return {
        success: false,
        message: 'Failed to delete contact submission'
      };
    }
  }
}
