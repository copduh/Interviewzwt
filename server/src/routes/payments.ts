import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { createOrder, captureOrder } from '../controllers/paymentsController';

const router = Router();

router.post('/create-order', authMiddleware, createOrder);
router.post('/capture/:orderId', authMiddleware, captureOrder);

export default router;
