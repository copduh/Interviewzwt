import { Router } from 'express';
import { analyzeResume, voiceInterview, scoreInterview } from '../controllers/functionsController';
import authMiddleware from '../middleware/auth';

const router = Router();

// Leaving analyze-resume public for now (but can be protected)
router.post('/analyze-resume', authMiddleware, analyzeResume);
router.post('/score-interview', authMiddleware, scoreInterview);
router.post('/voice-interview', authMiddleware, voiceInterview);

export default router;
