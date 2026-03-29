import express from 'express';
import { getCurrentSession, logoutSession } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/me', authenticateUser, asyncHandler(getCurrentSession));
router.post('/logout', authenticateUser, asyncHandler(logoutSession));

export default router;
