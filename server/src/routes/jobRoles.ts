import { Router } from 'express';
import { listJobRoles, getJobRole } from '../controllers/jobRoleController';

const router = Router();

router.get('/', listJobRoles);
router.get('/:id', getJobRole);

export default router;
