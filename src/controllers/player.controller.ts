import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { sendSuccess } from '../utils/response.js';
import { Currency } from '../generated/prisma/enums.js';

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

function readTopupAmount(body: unknown): number {
  const amount = (body as { amount?: unknown })?.amount;

  if (
    typeof amount !== 'number' ||
    !Number.isInteger(amount) ||
    amount <= 0
  ) {
    throw new HttpError(
      400,
      'Amount harus bilangan bulat lebih dari 0',
    );
  }

  return amount;
}

export async function topupPlayer(req: Request, res: Response) {
  const id = parsePlayerId(req.params.player_id);
  const amount = readTopupAmount(req.body);

  const player = await prisma.player.findUnique({
    where: { id },
  });

  if (!player) {
    throw new HttpError(404, 'Player tidak ditemukan');
  }

  const updated = await prisma.player.update({
    where: { id },
    data: {
      diamond: {
        increment: amount,
      },
    },
  });

  sendSuccess(res, {
    message: 'Berhasil melakukan top up diamond',
    data: {
      playerId: updated.id,
      amount,
      diamond: updated.diamond,
    },
  });
}

export async function createMatch(req: Request, res: Response) {
  const id = parsePlayerId(req.params.player_id);

  const result = (req.body as { result?: unknown })?.result;

  if (result !== 'WIN' && result !== 'LOSE') {
    throw new HttpError(400, 'Result harus WIN atau LOSE');
  }

  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) {
    throw new HttpError(404, 'Player tidak ditemukan');
  }

  const bpEarned = result === 'WIN' ? 300 : 100;

  const updated = await prisma.player.update({
    where: { id },
    data: { bp: { increment: bpEarned } },
  });

  sendSuccess(res, {
    message: 'Berhasil mencatat match',
    data: {
      playerId: updated.id,
      result,
      bpEarned,
      bp: updated.bp,
    },
  });
}

export async function buyHero(req: Request, res: Response) {
  const playerId = parsePlayerId(req.params.player_id);
  const body = req.body as {
    heroId?: unknown;
    currency?: unknown;
  };

  const heroId = body?.heroId;
  const currency = body?.currency;

  if (
    typeof heroId !== 'number' ||
    !Number.isInteger(heroId) ||
    heroId <= 0 ||
    typeof currency !== 'string' ||
    !Object.values(Currency).includes(currency as Currency)
  ) {
    throw new HttpError(
      400,
      'Hero ID harus bilangan bulat positif dan currency harus BP atau DIAMOND',
    );
  }

  const selectedCurrency = currency as Currency;

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new HttpError(404, 'Player tidak ditemukan');
  }

  const hero = await prisma.hero.findUnique({ where: { id: heroId } });
  if (!hero) {
    throw new HttpError(404, 'Hero tidak ditemukan');
  }

  const price =
    selectedCurrency === Currency.BP ? hero.priceBP : hero.priceDiamond;

  if (price === null) {
    throw new HttpError(400, 'Hero tidak tersedia untuk currency ini');
  }

  const owned = await prisma.playerHero.findUnique({
    where: { playerId_heroId: { playerId, heroId } },
  });

  if (owned) {
    throw new HttpError(409, 'Player sudah memiliki hero ini');
  }

  const balance =
    selectedCurrency === Currency.BP ? player.bp : player.diamond;

  if (balance < price) {
    throw new HttpError(400, 'Saldo tidak mencukupi');
  }

  const [updatedPlayer] = await prisma.$transaction([
    prisma.player.update({
      where: { id: playerId },
      data:
        selectedCurrency === Currency.BP
          ? { bp: { decrement: price } }
          : { diamond: { decrement: price } },
    }),
    prisma.playerHero.create({
      data: {
        playerId,
        heroId,
        currency: selectedCurrency,
        pricePaid: price,
      },
    }),
  ]);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Berhasil membeli hero',
    data: {
      hero,
      currency: selectedCurrency,
      pricePaid: price,
      balance: { bp: updatedPlayer.bp, diamond: updatedPlayer.diamond },
    },
  });
}