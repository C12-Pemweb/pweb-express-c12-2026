import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.status(200).json({
    status: true,
    message: 'Server berjalan dengan baik',
    data: null,
  });
});

export default router;
