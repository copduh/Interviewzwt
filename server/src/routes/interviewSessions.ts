import { Router } from 'express';
import { createSession, updateSession, getSession } from '../controllers/interviewSessionController';
import authMiddleware from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, createSession);
router.get('/:id', authMiddleware, getSession);
router.patch('/:id', authMiddleware, updateSession);

export default router;
