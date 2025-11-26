import { Router } from 'express';
import { createSession, updateSession, getSession } from '../controllers/interviewSessionController';
import authMiddleware from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.post('/', createSession);
router.get('/:id', getSession);
router.patch('/:id', updateSession);

export default router;
