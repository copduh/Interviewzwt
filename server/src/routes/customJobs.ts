import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { createCustomJob, listCustomJobs, getCustomJob } from '../controllers/customJobController';

const router = Router();

router.use(authMiddleware);
router.post('/', authMiddleware, createCustomJob);
router.get('/', authMiddleware, listCustomJobs);
router.get('/:id', authMiddleware, getCustomJob);

export default router;
