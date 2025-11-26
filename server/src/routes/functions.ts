import { Router } from 'express';
import { analyzeResume, voiceInterview } from '../controllers/functionsController';
import authMiddleware from '../middleware/auth';

const router = Router();

// Leaving analyze-resume public for now (but can be protected)
router.post('/analyze-resume', authMiddleware, analyzeResume);
router.post('/voice-interview', authMiddleware, voiceInterview);

export default router;
