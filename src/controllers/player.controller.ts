import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { sendSuccess } from '../utils/response.js';

function parsePlayerId(value: string | string[]): number {
  const id = Number(Array.isArray(value) ? value[0] : value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(404, 'Player tidak ditemukan');
  }

  return id;
}

function readNickname(body: unknown): string {
  const nickname = typeof (body as { nickname?: unknown })?.nickname === 'string'
    ? (body as { nickname: string }).nickname.trim()
    : '';

  if (!nickname) {
    throw new HttpError(400, 'Nickname wajib diisi');
  }

  return nickname;
}

export async function createPlayer(req: Request, res: Response) {
  const nickname = readNickname(req.body);

  const existing = await prisma.player.findUnique({ where: { nickname } });
  if (existing) {
    throw new HttpError(409, 'Nickname sudah dipakai');
  }

  const player = await prisma.player.create({ data: { nickname } });

  sendSuccess(res, {
    statusCode: 201,
    message: 'Berhasil membuat player',
    data: player,
  });
}

export async function getPlayer(req: Request, res: Response) {
  const player = await prisma.player.findUnique({
    where: { id: parsePlayerId(req.params.player_id) },
    include: {
      heroes: {
        include: { hero: { select: { name: true } } },
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!player) {
    throw new HttpError(404, 'Player tidak ditemukan');
  }

  const { heroes, ...playerData } = player;

  sendSuccess(res, {
    message: 'Berhasil mengambil data player',
    data: {
      ...playerData,
      heroes: heroes.map((owned) => ({
        heroId: owned.heroId,
        name: owned.hero.name,
        currency: owned.currency,
        pricePaid: owned.pricePaid,
      })),
    },
  });
}

export async function updatePlayer(req: Request, res: Response) {
  const id = parsePlayerId(req.params.player_id);

  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) {
    throw new HttpError(404, 'Player tidak ditemukan');
  }

  const nickname = readNickname(req.body);

  const existing = await prisma.player.findUnique({ where: { nickname } });
  if (existing && existing.id !== id) {
    throw new HttpError(409, 'Nickname sudah dipakai player lain');
  }

  const updated = await prisma.player.update({ where: { id }, data: { nickname } });

  sendSuccess(res, {
    message: 'Berhasil memperbarui player',
    data: updated,
  });
}

export async function deletePlayer(req: Request, res: Response) {
  const id = parsePlayerId(req.params.player_id);

  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) {
    throw new HttpError(404, 'Player tidak ditemukan');
  }

  await prisma.player.delete({ where: { id } });

  sendSuccess(res, { message: 'Player berhasil dihapus', data: null });
}
