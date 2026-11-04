import { Router } from 'express';
import { createHero, getHero, getHeroes } from '../controllers/hero.controller.js';

const router = Router();

router.get('/', getHeroes);
router.get('/:hero_id', getHero);
router.post('/', createHero);

export default router;
