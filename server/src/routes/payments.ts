import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { createOrder, captureOrder } from '../controllers/paymentsController';

const router = Router();

router.post('/create-order', authMiddleware, createOrder);
// capture should be callable after PayPal redirect; allow unauthenticated capture and use stored mapping
router.post('/capture/:orderId', captureOrder);

export default router;
