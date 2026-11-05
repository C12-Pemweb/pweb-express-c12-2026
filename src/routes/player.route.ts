import { Router } from 'express';
import {
  createPlayer,
  deletePlayer,
  getPlayer,
  updatePlayer,
  topupPlayer,
  createMatch,
  buyHero,
} from '../controllers/player.controller.js';



const router = Router();

router.post('/', createPlayer);
router.post('/:player_id/topup', topupPlayer);
router.post('/:player_id/matches', createMatch);
router.post('/:player_id/heroes', buyHero);
router.get('/:player_id', getPlayer);
router.patch('/:player_id', updatePlayer);
router.delete('/:player_id', deletePlayer);

export default router;
