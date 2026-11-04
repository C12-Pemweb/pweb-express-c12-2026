import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';
import { buildPaginationMeta, getPagination } from '../utils/pagination.js';
import { sendSuccess } from '../utils/response.js';
import { Rarity } from '../generated/prisma/enums.js';

export async function getSkins(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req.query);
  const heroIdRaw = typeof req.query.heroId === 'string' ? req.query.heroId : undefined;
  const rarity = typeof req.query.rarity === 'string' ? req.query.rarity.toUpperCase() : '';
  const heroId = heroIdRaw === undefined ? undefined : Number(heroIdRaw);

  if (heroId !== undefined && (!Number.isInteger(heroId) || heroId <= 0)) {
    throw new HttpError(400, 'heroId harus bilangan bulat positif');
  }
  if (rarity && !Object.values(Rarity).includes(rarity as Rarity)) {
    throw new HttpError(400, 'Rarity skin tidak valid');
  }

  const where = {
    ...(heroId !== undefined && { heroId }),
    ...(rarity && { rarity: rarity as Rarity }),
  };

  const [skins, totalItems] = await Promise.all([
    prisma.skin.findMany({
      where,
      include: { hero: { select: { id: true, name: true } } },
      skip,
      take: limit,
      orderBy: { id: 'asc' },
    }),
    prisma.skin.count({ where }),
  ]);

  sendSuccess(res, {
    message: 'Berhasil mengambil data skin',
    data: skins,
    metadata: buildPaginationMeta(page, limit, totalItems),
  });
}

export async function getSkin(req: Request, res: Response) {
  const raw = Array.isArray(req.params.skin_id) ? req.params.skin_id[0] : req.params.skin_id;
  const id = Number(raw);
  if (!raw || !Number.isInteger(id) || id <= 0) {
    throw new HttpError(404, 'Skin tidak ditemukan');
  }

  const skin = await prisma.skin.findUnique({
    where: { id },
    include: { hero: true },
  });
  if (!skin) throw new HttpError(404, 'Skin tidak ditemukan');

  sendSuccess(res, { message: 'Berhasil mengambil detail skin', data: skin });
}
