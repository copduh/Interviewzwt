import { Router } from 'express';
import { listJobRoles, getJobRole } from '../controllers/jobRoleController';
import authMiddleware from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, listJobRoles);
router.get('/:id', authMiddleware, getJobRole);

export default router;
