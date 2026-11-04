import { Router } from 'express';
import { getSkin, getSkins } from '../controllers/skin.controller.js';

const router = Router();

router.get('/', getSkins);
router.get('/:skin_id', getSkin);

export default router;
