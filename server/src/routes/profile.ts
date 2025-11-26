import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { getProfile, updateCredits } from '../controllers/profileController';

const router = Router();

router.use(authMiddleware);
router.get('/me', getProfile);
router.patch('/credits', updateCredits);

export default router;
