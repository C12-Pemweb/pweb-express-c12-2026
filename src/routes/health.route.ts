import { Router } from 'express';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/', (_req, res) => {
  sendSuccess(res, { message: 'Server berjalan dengan baik', data: null });
});

export default router;
