import { Router } from 'express';
import {
  createPlayer,
  deletePlayer,
  getPlayer,
  updatePlayer,
} from '../controllers/player.controller.js';

const router = Router();

router.post('/', createPlayer);
router.get('/:player_id', getPlayer);
router.patch('/:player_id', updatePlayer);
router.delete('/:player_id', deletePlayer);

export default router;
