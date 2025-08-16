import { Request, Response } from 'express';
import { ContactService } from '../services/contact-service';

class ContactController {
  private contactService: ContactService;

  constructor() {
    this.contactService = new ContactService();
  }

  submitContactForm = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, subject, message } = req.body;

      // Validate required fields
      if (!name || !email || !subject || !message) {
        res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
        return;
      }

      // Submit contact form
      const result = await this.contactService.submitContactForm({
        name,
        email,
        subject,
        message
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
          data: {
            id: result.data?.id,
            submittedAt: result.data?.createdAt
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || 'Failed to submit contact form'
        });
      }
    } catch (error: any) {
      console.error('Contact form submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again later.'
      });
    }
  };

  // Get all contact submissions (admin only)
  getAllContactSubmissions = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      const result = await this.contactService.getAllContactSubmissions({
        page,
        limit,
        status
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          pagination: result.pagination
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || 'Failed to fetch contact submissions'
        });
      }
    } catch (error: any) {
      console.error('Get contact submissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Mark contact submission as read (admin only)
  markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.contactService.markAsRead(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Contact submission marked as read'
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message || 'Contact submission not found'
        });
      }
    } catch (error: any) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Delete contact submission (admin only)
  deleteContactSubmission = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.contactService.deleteContactSubmission(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Contact submission deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.message || 'Contact submission not found'
        });
      }
    } catch (error: any) {
      console.error('Delete contact submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

export default ContactController;
