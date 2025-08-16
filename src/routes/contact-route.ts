import express from 'express';
import ContactController from '../controllers/contact-controller';
import { authenticateToken } from '../middleware/auth-middleware';

const contactRouter = express.Router();
const contactController = new ContactController();

// Public route - Submit contact form
contactRouter.post('/submit', contactController.submitContactForm);

// Protected routes - Admin only
contactRouter.get('/submissions', authenticateToken, contactController.getAllContactSubmissions);
contactRouter.patch('/submissions/:id/read', authenticateToken, contactController.markAsRead);
contactRouter.delete('/submissions/:id', authenticateToken, contactController.deleteContactSubmission);

export default contactRouter;
