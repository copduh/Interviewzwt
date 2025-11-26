import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { createCustomJob, listCustomJobs } from '../controllers/customJobController';

const router = Router();

router.use(authMiddleware);
router.post('/', createCustomJob);
router.get('/', listCustomJobs);

export default router;
